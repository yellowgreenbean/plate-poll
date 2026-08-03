# PlatePoll (오늘뭐먹지) — DB 스키마 및 기능 구현 계획서

## 개요

PlatePoll는 사내 부서 단위로 점심 장소를 1·2·3지망 다수결 투표로 정하고, 부서/회사별 득표 랭킹과 타 조직 랭킹까지 열람할 수 있는 서비스다. 현재 저장소는 Next.js 16.2.12(App Router) + Supabase 스캐폴드 상태이며, 실제로 존재하는 건 `restaurants` 테이블 하나(RLS 비활성, **critical 보안 이슈**)뿐이다. 저장소에 있는 두 기획서(`lunch-vote-lean-spec.md`, `lunch-vote-service-plan.md`) 사이에 투표 방식이 살짝 어긋나는데(랭크 투표 vs 단일 선택), 이 문서는 사용자가 직접 전달한 요구사항과 lean-spec의 1·2·3지망 랭크 투표 모델을 기준으로 삼는다. service-plan의 단일 선택/무작위 동점 처리/FastAPI+Redis 아키텍처 서술은 이 계획에서 제외한다.

이 문서는 (1) Organization/Department/User/Restaurant/Vote/VoteOption/VoteResponse 테이블 구조를 확정하고, (2) RLS로 조직 간 데이터 격리(집계만 공개, 개인 응답은 비공개)를 설계하고, (3) Next.js 16의 변경된 규칙(Proxy, async params, Server Actions 인증 재검증 등)에 맞는 라우트/서버 액션 구조를 정리하고, (4) 카카오맵 연동 방식을 정하기 위한 설계 문서다. **아직 마이그레이션이나 코드는 적용하지 않았으며, 이 문서는 계획 단계 산출물이다.**

### 확정된 결정사항
1. **인증**: 이메일 + 비밀번호 (Supabase Auth `signUp`/`signInWithPassword`), 이메일 확인(confirmation) 사용.
2. **투표 마감**: 별도 배치/cron 없음. `closes_at`을 읽는 시점에 `now() > closes_at`로 항상 계산(lazy). `status` 컬럼은 취소(`cancelled`) 여부만 저장.
3. **동점 처리**: 공동 1위로 표시 (`RANK()` 윈도우 함수로 자연스럽게 구현).
4. **랭킹 가중치**: 1지망 3점, 2지망 2점, 3지망 1점 합산.
5. **조직 자동 생성**: 이메일 도메인 제한 없음(공개 이메일 도메인도 그대로 회사로 생성됨, MVP 단순화 우선).
6. **온보딩 부서 지정**: 같은 회사의 기존 부서 드롭다운 선택 + "새 부서 만들기" 자유 입력.
7. **투표 재제출**: 마감 전까지 몇 번이든 1·2·3지망을 자유롭게 수정 가능 (기존 응답 삭제 후 재저장).
8. **누적 랭킹 집계 범위**: 마감 여부와 무관하게 진행 중인 투표의 현재 응답도 포함해 실시간 집계.
9. **카카오 "별점" 필드**: 카카오 로컬 검색 API/지도 JS SDK 모두 공개적으로 소비 가능한 별점 필드를 제공하지 않으므로, `restaurants.rating` 컬럼은 두지 않고 대신 `place_url`(카카오맵 상세 링크)을 저장해 "카카오맵에서 별점·리뷰 보기" 링크로 대체한다.
10. **랭킹/타 조직 열람도 로그인 필요**: RLS/RPC가 `authenticated` 권한으로만 실행되도록 설계했으므로 비로그인 열람은 지원하지 않는다(추후 필요시 별도 논의).

---

## 1. 최종 Postgres 스키마

새 테이블은 `uuid` PK(`gen_random_uuid()`), 기존 `restaurants`는 `bigint identity` PK를 유지(라이브 데이터 호환).

```sql
-- organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_domain text not null unique,
  created_at timestamptz not null default now()
);

-- departments
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);
create index idx_departments_org_id on public.departments(org_id);

-- profiles (id === auth.users.id, Supabase 표준 패턴)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id),
  dept_id uuid not null references public.departments(id),
  email text not null,
  name text,
  created_at timestamptz not null default now()
);
create index idx_profiles_org_id on public.profiles(org_id);
create index idx_profiles_dept_id on public.profiles(dept_id);

-- restaurants: 기존 테이블에 ALTER로 컬럼 추가
alter table public.restaurants
  add column kakao_place_id text unique,
  add column address text,
  add column lat double precision,
  add column lng double precision,
  add column place_url text,
  add column category text,
  add column created_by uuid references public.profiles(id),
  add column updated_at timestamptz not null default now();
create index idx_restaurants_kakao_place_id on public.restaurants(kakao_place_id);

-- votes
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  dept_id uuid not null references public.departments(id),
  created_by uuid not null references public.profiles(id),
  title text,
  closes_at timestamptz not null,
  status text not null default 'open' check (status in ('open','cancelled')),
  created_at timestamptz not null default now()
);
create index idx_votes_dept_id on public.votes(dept_id);
create index idx_votes_closes_at on public.votes(closes_at);
-- 실제 마감 여부는 항상 계산: is_closed := (status='cancelled') OR (now() > closes_at)

-- vote_options
create table public.vote_options (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  restaurant_id bigint not null references public.restaurants(id),
  created_at timestamptz not null default now(),
  unique (vote_id, restaurant_id)
);
create index idx_vote_options_vote_id on public.vote_options(vote_id);
create index idx_vote_options_restaurant_id on public.vote_options(restaurant_id);

-- vote_responses
create table public.vote_responses (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  option_id uuid not null references public.vote_options(id) on delete cascade,
  rank smallint not null check (rank between 1 and 3),
  points smallint generated always as (4 - rank) stored, -- 1지망=3, 2지망=2, 3지망=1
  created_at timestamptz not null default now(),
  unique (vote_id, user_id, rank),
  unique (vote_id, user_id, option_id)
);
create index idx_vote_responses_option_id on public.vote_responses(option_id);
create index idx_vote_responses_vote_user on public.vote_responses(vote_id, user_id);

-- option_id가 반드시 같은 vote_id에 속하도록 보장 (CHECK로 표현 불가 → 트리거)
create function public.check_vote_response_option_matches_vote()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.vote_options vo
    where vo.id = new.option_id and vo.vote_id = new.vote_id
  ) then
    raise exception 'option_id does not belong to vote_id';
  end if;
  return new;
end; $$;

create trigger trg_vote_response_option_check
  before insert or update on public.vote_responses
  for each row execute function public.check_vote_response_option_matches_vote();
```

재제출은 "마감 전까지 자유롭게 수정" 결정에 따라, `submit_vote_response` RPC 내부에서 `delete from vote_responses where vote_id=... and user_id=...` 후 새 선택지들을 재삽입하는 트랜잭션으로 처리한다.

---

## 2. RLS 정책 설계

모든 테이블에 `enable row level security` 적용. 정책 없는 테이블은 기본적으로 전면 차단되며, 이를 이용해 일부 쓰기는 RPC(`SECURITY DEFINER`)로만 가능하게 강제한다.

**헬퍼 함수 (profiles 자기참조 재귀 방지):**
```sql
create function public.current_profile()
returns table(org_id uuid, dept_id uuid)
language sql stable security definer set search_path = public as $$
  select org_id, dept_id from public.profiles where id = auth.uid();
$$;
grant execute on function public.current_profile() to authenticated;
```

| 테이블 | anon | authenticated |
|---|---|---|
| organizations | 없음 | `SELECT using (true)` (랭킹에서 조직명 노출 필요). INSERT/UPDATE는 `complete_signup` RPC 전용. |
| departments | 없음 | `SELECT using (true)`. `INSERT with check (org_id = (select org_id from current_profile()))`. |
| profiles | 없음 | `SELECT using (id = auth.uid() or org_id = (select org_id from current_profile()))` (본인 + 같은 조직만). `UPDATE using (id = auth.uid())`. INSERT는 `complete_signup` RPC 전용. |
| restaurants | `SELECT using (true)` | `SELECT using (true)`, `INSERT with check (created_by = auth.uid())`. |
| votes | 없음 | `SELECT using (dept_id = (select dept_id from current_profile()))`. `INSERT with check (dept_id = (select dept_id from current_profile()) and created_by = auth.uid())`. `UPDATE using (created_by = auth.uid())` (본인 투표 취소용). |
| vote_options | 없음 | `SELECT using (exists (select 1 from votes v where v.id=vote_options.vote_id and v.dept_id=(select dept_id from current_profile())))`. INSERT는 `create_vote` RPC 전용. |
| vote_responses | 없음 | `SELECT using (user_id = auth.uid())` (본인 응답만, 동료 응답도 비공개). INSERT/UPDATE/DELETE는 `submit_vote_response` RPC 전용. |

**타 조직 집계 열람**: `vote_responses`의 row 정책을 완화하지 않고, PII가 아예 없는 반환 타입의 `SECURITY DEFINER` 함수로 노출한다.

```sql
create function public.get_rankings(p_scope text, p_org_id uuid default null, p_dept_id uuid default null)
returns table(restaurant_id bigint, restaurant_name text, total_points bigint, total_votes bigint, rnk int)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, sum(vr.points)::bigint, count(*)::bigint,
         rank() over (order by sum(vr.points) desc)
  from public.vote_responses vr
  join public.vote_options vo on vo.id = vr.option_id
  join public.votes v on v.id = vo.vote_id
  join public.departments d on d.id = v.dept_id
  join public.restaurants r on r.id = vo.restaurant_id
  where (p_scope = 'org' and d.org_id = p_org_id)
     or (p_scope = 'dept' and v.dept_id = p_dept_id)
  group by r.id, r.name;
$$;
grant execute on function public.get_rankings(text, uuid, uuid) to authenticated;
```
결정사항 8에 따라 이 함수는 `status`/`closes_at`으로 필터링하지 않고 모든 투표(진행 중 포함)를 집계한다. `RANK()`가 동점을 공동 순위로 자동 처리한다(결정사항 3).

단일 투표 결과(진행 중/마감 후 공동 1위 표시)는 별도 함수로:
```sql
create function public.get_vote_results(p_vote_id uuid)
returns table(restaurant_id bigint, restaurant_name text, total_points bigint, total_votes bigint, rnk int, is_closed boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, coalesce(sum(vr.points),0)::bigint, coalesce(count(vr.id),0)::bigint,
         rank() over (order by coalesce(sum(vr.points),0) desc),
         (v.status = 'cancelled' or now() > v.closes_at)
  from public.votes v
  join public.vote_options vo on vo.vote_id = v.id
  left join public.vote_responses vr on vr.option_id = vo.id
  join public.restaurants r on r.id = vo.restaurant_id
  where v.id = p_vote_id
  group by r.id, r.name, v.status, v.closes_at;
$$;
grant execute on function public.get_vote_results(uuid) to authenticated;
```

---

## 3. 회원가입/온보딩 흐름

1. `src/app/(auth)/signup/page.tsx` + `actions.ts` — `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`, "이메일을 확인해주세요" 안내.
2. `src/app/auth/callback/route.ts` (Route Handler, GET) — `@supabase/ssr`로 PKCE 코드 교환 후 세션 쿠키 설정, `/onboarding`으로 리다이렉트.
3. `src/app/onboarding/page.tsx` + `actions.ts` — 서버에서 `auth.uid()`의 이메일 도메인으로 조직을 찾거나 없으면 새로 생성(제한 없음, 결정사항 5), 같은 조직의 기존 부서 목록을 보여주는 드롭다운 + "새 부서 만들기" 입력 제공(결정사항 6). 제출 시 `complete_signup(p_dept_id, p_new_dept_name)` RPC(`SECURITY DEFINER`, 항상 `auth.uid()` 기준으로 프로필 생성) 호출 후 `/votes`로 이동.
4. `src/proxy.ts` — 세션 쿠키 존재 여부만 확인하는 optimistic 체크(Next 16 권고사항: proxy는 인증의 전부가 아님).
5. `src/app/(app)/layout.tsx` — 실제 인가 지점. 세션 + `profiles` row 조회, 프로필 없으면 `/onboarding`으로 리다이렉트.

---

## 4. 라우트 구조 (`src/app/`)

| 경로 | 유형 | 비고 |
|---|---|---|
| `src/app/layout.tsx` | Server | 한글 브랜딩으로 교체 (현재 보일러플레이트) |
| `src/app/page.tsx` | Server | 세션+프로필 있으면 `/votes`로 리다이렉트 |
| `src/app/(auth)/login/page.tsx`+`actions.ts` | Server 껍데기/`'use client'` 폼 | `signInAction` |
| `src/app/(auth)/signup/page.tsx`+`actions.ts` | 위와 동일 | `signUpAction` |
| `src/app/auth/callback/route.ts` | Route Handler | 코드 교환 |
| `src/app/onboarding/page.tsx`+`actions.ts` | Server 껍데기/client 폼 | `completeSignupAction` |
| `src/app/(app)/layout.tsx` | Server | 인가 게이트, 네비게이션 |
| `src/app/(app)/restaurants/page.tsx` | Server | 후보 식당 풀 목록 + 검색 UI |
| `src/app/api/kakao/search/route.ts` | Route Handler(GET) | 검색어 입력 중 반복 호출/취소가 필요해 Server Action 대신 일반 fetch+AbortController 방식 사용 |
| `src/app/(app)/restaurants/add/actions.ts` | Server Action | `addRestaurantAction` (kakao_place_id 기준 upsert) |
| `src/app/(app)/restaurants/[id]/page.tsx` | Server 껍데기/client 지도 임베드 | 상세 + "카카오맵에서 별점 보기" 링크 |
| `src/app/(app)/votes/page.tsx` | Server | 우리 부서 투표 목록 |
| `src/app/(app)/votes/new/page.tsx`+`actions.ts` | Server 껍데기/client 다중선택 폼 | `createVoteAction` |
| `src/app/(app)/votes/[voteId]/page.tsx`+`actions.ts` | Server 껍데기/client 랭크 선택 폼 | `submitVoteResponseAction`(자유 재제출), `cancelVoteAction` — 참여+결과 화면 통합 |
| `src/app/(app)/rankings/page.tsx` | Server | `searchParams`(await 필요)로 우리 부서/우리 회사/타 회사 탭 전환 |
| `src/proxy.ts` | proxy (Node 런타임, `export function proxy`) | 세션 쿠키 optimistic 체크 |
| `src/lib/supabase/server.ts` | — | `@supabase/ssr` `createServerClient` |
| `src/lib/supabase/client.ts` | — | `@supabase/ssr` `createBrowserClient` (기존 `src/lib/supabase.ts` 대체) |
| `src/lib/kakao.ts` | server-only | 카카오 로컬 검색 REST 호출 래퍼, client 코드에서 import 금지 |

Next.js 16 규칙 준수사항: 모든 `params`/`searchParams`는 `await`, Server Action 내부에서 항상 `auth.uid()` 기준 재검증(클라이언트 상태 신뢰 금지), `middleware.ts`가 아닌 `proxy.ts`/`proxy` 함수명 사용.

캐싱 모델은 `cacheComponents: true`를 켜지 않고 기존 `dynamic`/`revalidate` 세그먼트 설정을 사용한다 — 이 앱의 페이지 대부분이 세션 개인화 또는 실시간에 가까운 득표 현황을 다뤄, Cache Components가 요구하는 정적 셸/Suspense 모델과 맞지 않는다.

---

## 5. 카카오맵 연동

- **REST API 키** (`KAKAO_REST_API_KEY`, server-only, `NEXT_PUBLIC_` 접두어 없음): 키워드 장소 검색(`GET https://dapi.kakao.com/v2/local/search/keyword.json`, `Authorization: KakaoAK {key}`), `src/lib/kakao.ts` / `src/app/api/kakao/search/route.ts`에서만 사용.
- **JS 키** (`NEXT_PUBLIC_KAKAO_JS_KEY`, 카카오 콘솔에서 도메인 제한 설정): 지도 임베드용 Maps JS SDK를 `next/script`로 로드.
- 두 키 모두 카카오 디벨로퍼스 콘솔에서 발급 필요 — 사용자가 별도로 준비해야 함.
- 카카오 API는 공개적으로 소비 가능한 별점 필드를 제공하지 않으므로 `restaurants.rating` 컬럼은 두지 않고 `place_url` 링크로 대체(결정사항 9).

---

## 6. 마이그레이션 순서 (추후 `apply_migration`으로 순차 적용 예정)

1. `enable_rls_restaurants` — 기존 `restaurants`에 RLS+기본 정책 적용 (advisor가 지적한 critical 이슈부터 즉시 해결).
2. `create_organizations_and_departments`
3. `create_profiles_table` (+ `current_profile()` 함수)
4. `alter_restaurants_add_kakao_fields`
5. `create_votes_table`
6. `create_vote_options_table`
7. `create_vote_responses_table` (+ 트리거)
8. `create_signup_and_ranking_functions` (`complete_signup`, `create_vote`, `submit_vote_response`, `get_rankings`, `get_vote_results` + grant)

마이그레이션 1, 3, 7, 8 이후 `get_advisors`로 새 보안 경고가 없는지 확인. 전체 완료 후 `generate_typescript_types`로 `src/lib/database.types.ts` 생성.

**현재 상태**: 위 마이그레이션 1~8과 보안/성능 하드닝 마이그레이션(`harden_function_security`, `revoke_anon_execute_on_rpcs`, `optimize_rls_and_fk_indexes`)까지 모두 Supabase 프로젝트(`jsjyzyzyunrxykdxwzba`)에 적용 완료. 전 테이블 RLS 활성화, `get_advisors` security 경고 0건(남은 항목은 "authenticated는 RPC 실행 가능" INFO성 경고로 의도된 동작), FK 인덱스 보강 완료. `src/lib/database.types.ts`에 최신 스키마 기반 TypeScript 타입 생성 완료.

---

## 7. 환경 변수

| 변수 | 범위 | 상태 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | 기존 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | 기존 |
| `KAKAO_REST_API_KEY` | server-only | 신규 (카카오 디벨로퍼스에서 발급 필요) |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | public(도메인 제한) | 신규 (카카오 디벨로퍼스에서 발급 필요) |

`SUPABASE_SERVICE_ROLE_KEY`는 필요 없음 — 권한이 필요한 쓰기는 모두 `auth.uid()` 범위로 제한된 `SECURITY DEFINER` RPC로 처리.

---

## 8. 구현 단계 (다음 진행 시 순서)

1. **스키마/RLS/마이그레이션**: 위 마이그레이션 1~8 적용 → advisors 재확인 → 타입 생성 → `@supabase/ssr` 설치 → `src/lib/supabase/{server,client}.ts` 추가, 기존 `src/lib/supabase.ts` 제거.
2. **인증/가입/온보딩**: proxy, `(auth)/login`, `(auth)/signup`, `auth/callback`, `onboarding`.
3. **식당 풀/카카오 검색**: 카카오 키 발급 확인 → `api/kakao/search` → `restaurants/*` 페이지/액션.
4. **투표 생성/참여**: `votes/new`, `votes/[voteId]`, `create_vote`/`submit_vote_response` RPC.
5. **결과/랭킹**: `get_rankings`/`get_vote_results` RPC 연결, `rankings/page.tsx`.
6. **다듬기**: advisors 재확인, 한글 카피 정리, 모바일 반응형 점검.
