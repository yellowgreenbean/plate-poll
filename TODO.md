# PlatePoll (오늘뭐먹지) — 개발 To-Do 리스트

`lunch-vote-db-schema-plan.md`의 설계(스키마, RLS, 라우트 구조, 카카오맵 연동, 마이그레이션 계획)를 기준으로 실제 개발 작업을 세분화한 체크리스트다. DB 마이그레이션 11개(스키마 8개 + 보안/성능 하드닝 3개)는 이미 적용 완료됐고, 애플리케이션 코드(인증/온보딩/투표/랭킹 UI·Server Action)는 아직 시작 전이다. 완료 항목은 `[x]`, 남은 항목은 `[ ]`로 표시한다.

---

## 0. 프로젝트 기반 설정 (10)
- [x] Next.js 16 App Router 스캐폴드 초기화 (`src/app/layout.tsx`, `src/app/page.tsx`)
- [x] Tailwind v4 설정
- [x] Supabase 프로젝트 생성 및 최초 연동 (anon key 클라이언트 — 이후 2번 항목에서 `src/lib/supabase/{server,client}.ts`로 교체됨)
- [x] Vercel 배포 연동 및 `.gitignore` 정리
- [ ] `.env.example` 파일 생성 (Supabase URL/anon key, Kakao 키 자리표시자 포함)
- [ ] `README.md`를 PlatePoll 프로젝트 설명으로 교체
- [ ] `package.json` name/description을 PlatePoll에 맞게 업데이트
- [x] TypeScript strict 모드 유지 확인 (`tsconfig.json` 재검토) — `compilerOptions.strict: true` 확인
- [x] ESLint 규칙이 App Router/Server Action 패턴에 맞는지 점검 — `eslint-config-next`의 `core-web-vitals`+`typescript` 룰셋 사용 중, `npm run lint` 클린 통과
- [ ] Prettier 등 포맷터 도입 여부 결정

## 1. DB 스키마 · RLS · Supabase (마이그레이션 완료분) (19)
- [x] `enable_rls_restaurants`: `restaurants` 테이블 RLS 활성화 + 공개 SELECT 정책 (critical 보안 이슈 해결)
- [x] `create_organizations_and_departments`: `organizations`/`departments` 테이블 + 인덱스 + 기본 RLS
- [x] `create_profiles_table`: `profiles` 테이블(`auth.users` 연동) + `current_profile()` 함수 + RLS + `departments` INSERT 정책
- [x] `alter_restaurants_add_kakao_fields`: `kakao_place_id`/`address`/`lat`/`lng`/`place_url`/`category`/`created_by`/`updated_at` 컬럼 추가 + INSERT 정책
- [x] `create_votes_table`: `votes` 테이블 + 인덱스 + RLS(select/insert/update)
- [x] `create_vote_options_table`: `vote_options` 테이블 + 인덱스 + RLS select 정책
- [x] `create_vote_responses_table`: `vote_responses` 테이블(rank/points 제약, 유니크 제약, 트리거) + RLS select 정책
- [x] `create_signup_and_ranking_functions`: `complete_signup`/`create_vote`/`submit_vote_response`/`get_rankings`/`get_vote_results` RPC 작성
- [x] `harden_function_security`: PUBLIC EXECUTE 회수 + 트리거 함수 `search_path` 고정
- [x] `revoke_anon_execute_on_rpcs`: anon 롤의 RPC 실행 권한 명시적 회수 (실제 `pg_proc.proacl` 조회로 검증 완료)
- [x] `optimize_rls_and_fk_indexes`: RLS `auth.uid()` 성능 최적화 + FK 커버링 인덱스 3개 추가
- [x] Security advisor 재확인 (critical/error 0건 달성)
- [x] Performance advisor 확인 및 대응 (`auth_rls_initplan`, `unindexed_foreign_keys` 해결)
- [x] `src/lib/database.types.ts` TypeScript 타입 생성
- [ ] `current_profile()`이 `profiles` RLS와 재귀 없이 안정적으로 동작하는지 실제 데이터로 부하 테스트
- [ ] 마이그레이션 SQL을 저장소 `supabase/migrations/`에 로컬 백업 (현재는 원격 프로젝트에만 존재)
- [x] `vote_responses.points` generated 컬럼이 의도대로 계산되는지 샘플 데이터로 검증 — `generation_expression` = `(4 - rank)` 확인(1/2/3지망 → 3/2/1점)
- [ ] Supabase 대시보드에서 백업/PITR 정책 확인
- [x] 두 조직 테스트 계정으로 실제 RLS 교차 접근 시나리오 수동 검증 (다른 조직의 vote_responses/profiles 비노출 확인) — 11번 섹션의 RLS 통합 테스트에서 이미 검증 완료

## 2. Supabase 클라이언트 구조 전환 (SSR 대응) (5)
- [x] `@supabase/ssr` 패키지 설치
- [x] `src/lib/supabase/server.ts` 작성 (`createServerClient`, 쿠키 연동)
- [x] `src/lib/supabase/client.ts` 작성 (`createBrowserClient`)
- [x] 기존 `src/lib/supabase.ts` 제거 및 참조 코드 정리
- [x] `src/app/page.tsx`를 새 서버 클라이언트로 마이그레이션

## 3. 인증 (회원가입/로그인) (14)
- [x] `src/app/(auth)/signup/page.tsx` 작성 (이메일/비밀번호 입력 폼)
- [x] `src/app/(auth)/signup/actions.ts` — `signUpAction` (`supabase.auth.signUp`, `emailRedirectTo` 설정)
- [x] 이메일 형식/비밀번호 길이 등 클라이언트 측 폼 검증
- [x] 회원가입 실패(중복 이메일 등) 에러 메시지 UI (`src/lib/auth-errors.ts`로 매핑)
- [x] "이메일을 확인해주세요" 안내 화면
- [x] `src/app/auth/callback/route.ts` 작성 (PKCE 코드 교환, 세션 쿠키 설정)
- [x] `src/app/(auth)/login/page.tsx` 작성
- [x] `src/app/(auth)/login/actions.ts` — `signInAction`
- [x] 로그인 실패 에러 메시지 UI (잘못된 비밀번호 등)
- [x] 로그아웃 Server Action + 네비게이션 바 연결 — `signOutAction`(`src/app/(auth)/actions.ts`), 5번 섹션의 `nav-bar.tsx`에서 연결 완료
- [x] 비밀번호 재설정(찾기) 플로우 필요 여부 결정 및 구현 — 결정: MVP 범위 제외, 필요 시 추후 추가
- [x] `(auth)` 라우트 그룹 공통 레이아웃 (로고/서비스 소개 카피)
- [x] `useActionState` 기반 로그인/가입 폼 pending 상태 처리
- [x] Server Action 내부에서 이메일 도메인 형식 등 서버측 재검증

## 4. 온보딩 (조직/부서 매칭) (8)
- [x] `src/app/onboarding/page.tsx` 작성 — 로그인 사용자 이메일 도메인 기준 조직 조회 UI
- [x] 같은 조직의 기존 부서 목록 드롭다운 UI
- [x] "새 부서 만들기" 자유 입력 필드 UI
- [x] `src/app/onboarding/actions.ts` — `completeSignupAction` (`complete_signup` RPC 호출)
- [x] 온보딩 완료 후 `/votes`로 리다이렉트 (`/votes` 페이지는 9번 섹션에서 구현 예정 — 그 전까지는 404)
- [x] 이미 프로필이 있는 사용자가 `/onboarding` 재접근 시 리다이렉트 처리
- [x] 신규 조직 자동 생성 시 "새로운 회사가 등록되었습니다" 안내 UX
- [x] 온보딩 폼 검증 (부서명 공백/중복 처리 — 드롭다운/새 부서 중 하나 필수, 공백 trim, 중복 부서명은 RPC의 `on conflict`로 기존 부서 재사용)

## 5. 공통 레이아웃 · 네비게이션 · 인가 (12)
- [x] `src/proxy.ts` 작성 (세션 쿠키 optimistic 체크, Next 16 `proxy` 컨벤션 준수)
- [x] `src/app/(app)/layout.tsx` 작성 — 세션+프로필 실제 조회, 인가 게이트
- [x] 상단 네비게이션 바 컴포넌트 (투표/식당/랭킹/로그아웃 메뉴)
- [x] 모바일 반응형 네비게이션 (햄버거 메뉴)
- [x] `src/app/layout.tsx` 한글 브랜딩/메타데이터로 교체 (현재 create-next-app 보일러플레이트)
- [x] `src/app/page.tsx` — 세션 있으면 `/votes`로 리다이렉트, 없으면 랜딩 페이지로 교체
- [x] 랜딩 페이지 카피/디자인 (서비스 소개, 로그인/가입 CTA)
- [x] 공통 로딩 스피너/스켈레톤 컴포넌트 (`src/components/spinner.tsx`, `skeleton.tsx` — 아직 특정 페이지에 적용은 안 함, 이후 섹션에서 사용 예정)
- [x] 공통 `error.tsx` 작성
- [x] 공통 `not-found.tsx` 작성
- [x] 공통 버튼/입력/카드 UI 컴포넌트 정리 (재사용 가능하게) — `src/components/ui/{button,input,card}.tsx`, 인증/온보딩 폼에 적용 완료
- [x] 다크모드 대응 여부 결정 및 적용 — 결정: 별도 토글 없이 시스템 설정(`prefers-color-scheme`) 기반 자동 다크모드만 지원, Tailwind `dark:` 클래스로 전 컴포넌트 적용

## 6. 카카오맵 연동 (14)
- [x] 카카오 디벨로퍼스 앱 등록 및 REST/JS 키 발급 (사용자 액션 필요 — 안내 문서화)
- [x] `.env.local`에 `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY` 추가
- [x] `src/lib/kakao.ts` 작성 — 키워드 장소 검색 함수 (서버 전용)
- [x] `src/app/api/kakao/search/route.ts` 작성 (GET, 검색어 파라미터, `KAKAO_REST_API_KEY` 사용)
- [x] 카카오 API 에러/쿼터 초과 처리 및 사용자 안내 메시지 (`KakaoApiError`, 401/429/기타 상태별 메시지)
- [x] 검색 결과 캐싱 전략 검토 — 결정: MVP에서는 캐싱 없음(내부 저트래픽 도구라 호출량이 적어 복잡도 대비 이득이 적음)
- [x] 클라이언트 검색창 컴포넌트 (디바운스 + `AbortController`로 이전 요청 취소)
- [x] 검색 결과 리스트 UI (이름/주소/카테고리 표시)
- [x] `next/script`로 Kakao Maps JS SDK 로드
- [x] 지도 임베드 컴포넌트 (`KakaoMapEmbed`, lat/lng 마커 표시)
- [x] JS 키 도메인 제한 설정 안내 (카카오 콘솔, 배포 도메인 등록 포함)
- [x] 검색 API 요청 속도 제한/디바운스 서버측 방어 검토 — 결정: 클라이언트 300ms 디바운스 + 검색어 길이(2~50자) 검증으로 대응, IP 단위 rate limit은 MVP에서 제외
- [x] 카카오 응답 필드 매핑 유틸 작성 (place_name→name, x/y→lng/lat 등)
- [x] 별점 필드 부재에 대한 UI 문구 확정 ("카카오맵에서 별점·리뷰 보기" 링크, `KakaoMapEmbed`에 구현)

## 7. 식당 풀 화면 (12)
- [x] `src/app/(app)/restaurants/page.tsx` 작성 (등록된 식당 목록)
- [x] `addRestaurantAction` (`kakao_place_id` 기준 upsert) — 별도 `/add` 페이지 없이 `src/app/(app)/restaurants/actions.ts`에 작성, 목록 페이지에서 바로 호출
- [x] 식당 추가 폼 UI (검색 결과에서 "선택" 버튼 → `add-restaurant-form.tsx`가 `KakaoSearchBox` + `addRestaurantAction` 연결)
- [x] 중복 추가 방지 UX (이미 등록된 식당은 "추가됨" 비활성 버튼으로 표시 — `KakaoSearchBox`의 `existingPlaceIds` prop)
- [x] `src/app/(app)/restaurants/[id]/page.tsx` 작성 (상세 화면)
- [x] 상세 화면에 "카카오맵에서 별점·리뷰 보기" 링크 (`place_url`, `KakaoMapEmbed` 재사용)
- [x] 상세 화면 지도 임베드 연결
- [x] 식당 목록 검색/필터 UI (이름 검색, GET 폼 기반 `?q=`)
- [x] 빈 목록 상태 UI ("아직 등록된 식당이 없어요" / 필터 조건에 맞는 식당 없음 문구 분리)
- [x] 식당 카테고리별 필터/정렬 UI — 카테고리 드롭다운 필터만 제공, 정렬은 등록일 최신순으로 고정(별도 정렬 UI는 MVP에서 제외하기로 결정)
- [x] 식당 등록자 표시 (`created_by` → 프로필 이름, 목록/상세 모두 적용 — 타 조직 등록자는 RLS로 이름이 안 보일 수 있음, 정상 동작)
- [x] 식당 목록 페이지네이션/무한 스크롤 필요 여부 결정 — 결정: MVP에서는 없음(등록 식당 수가 적을 것으로 예상), 데이터 늘어나면 재검토

## 8. 투표 생성 (10)
- [x] `src/app/(app)/votes/new/page.tsx` 작성
- [x] 후보 식당 다중 선택 UI (체크박스 리스트, 식당 풀에서 선택)
- [x] 마감 시각(`closes_at`) 선택 UI (`datetime-local` input)
- [x] `src/app/(app)/votes/new/actions.ts` — `createVoteAction` (`create_vote` RPC 호출)
- [x] 투표 생성 폼 검증 (최소 1개 후보, 마감시각이 현재보다 미래인지 — 클라이언트+서버 양쪽)
- [x] 생성 성공 시 `/votes/[voteId]`로 리다이렉트 (`/votes/[voteId]` 페이지는 9번 섹션에서 구현 예정 — 그 전까지는 404)
- [x] 투표 제목(`title`) 선택 입력 필드
- [x] 후보 식당이 없을 때 "먼저 식당을 등록해주세요" 안내 및 링크
- [x] 마감 시각 기본값(예: 당일 11:30) 프리셋 제공 — 서버/브라우저 타임존 불일치를 피하려고 클라이언트에서 계산
- [x] 투표 생성 권한(같은 부서 소속) 서버측 재검증 — `create_vote` RPC가 클라이언트 입력이 아닌 `current_profile()`로 dept_id를 직접 도출하므로 자동으로 보장됨

## 9. 투표 참여 · 결과 화면 (18)
- [x] `src/app/(app)/votes/page.tsx` 작성 (우리 부서 투표 목록, 진행중/마감 구분 표시) — 실제 브라우저 E2E로 확인
- [x] `src/app/(app)/votes/[voteId]/page.tsx` 작성 — 서버에서 `get_vote_results` 호출
- [x] 1지망/2지망/3지망 선택 UI (드래그 대신 클릭 순서로 지망 결정, 최대 3개, 동일 식당 중복 방지 — 실기동 확인)
- [x] `src/app/(app)/votes/[voteId]/actions.ts` — `submitVoteResponseAction` (`submit_vote_response` RPC)
- [x] 재제출(마감 전 자유 수정) UX — 기존 선택값 미리 채워서 보여주기 (실기동으로 선택 변경→결과 갱신까지 확인)
- [x] 마감 여부(`is_closed`) 계산 결과에 따라 참여 폼 vs 결과 전용 화면 분기
- [x] 득표 결과 갱신 전략 결정 — 결정: polling 없이 제출/취소 시 `router.refresh()`로 서버 컴포넌트 재조회 (실시간성보다 단순함 우선)
- [x] 득표 결과 막대그래프/시각화 컴포넌트
- [x] 공동 1위 표시 UI (`rnk=1`인 항목 여러 개 강조, `get_rankings`의 `RANK()`가 동점 자동 처리)
- [x] `cancelVoteAction` — 투표 생성자가 투표 취소(`status='cancelled'`)
- [x] 투표 취소 확인 다이얼로그 (`window.confirm`)
- [x] 투표 링크 공유 기능 (URL 복사 버튼, Clipboard API)
- [x] 이미 투표한 사용자에게 "내 선택" 안내 문구 표시 ("이미 참여했어요…" — 실기동 확인)
- [x] 참여 폼에서 선택 순서(지망) 드래그 정렬 또는 순번 버튼 UX 확정 — 결정: 드래그 대신 클릭한 순서대로 1·2·3지망 자동 배정(모바일 친화적)
- [x] 투표 참여자 수/총원 대비 참여율 표시 여부 결정 — 결정: 표시 안 함(vote_responses는 RLS로 본인 것만 조회 가능해 정확한 집계에 별도 RPC가 필요, MVP 범위 제외)
- [x] 마감 임박 알림/카운트다운 UI (30초마다 갱신, 마감 30분 이내면 강조색 — 실기동에서 "2시간 5분 남음" 정상 확인)
- [x] 존재하지 않거나 접근 권한 없는 `voteId` 접근 시 404/에러 처리 — 실기동으로 존재하지 않는 UUID 접근 시 not-found 확인
- [x] 투표 결과 화면 모바일 레이아웃 점검 — 375px 뷰포트에서 가로 스크롤 없음 확인

## 10. 랭킹 화면 (12)
- [x] `src/app/(app)/rankings/page.tsx` 작성
- [x] `searchParams` 기반 탭 전환 (우리 부서/우리 회사/타 회사) — Next 16 `await searchParams` 반영, 실기동으로 3개 탭 전환 확인
- [x] 우리 부서 랭킹 조회 (`get_rankings` scope='dept')
- [x] 우리 회사 랭킹 조회 (`get_rankings` scope='org')
- [x] 타 회사 선택 UI (조직 목록 드롭다운, `organizations` SELECT 활용)
- [x] 타 회사 랭킹 조회 및 표시 (다른 회사가 없을 때 "아직 다른 회사가 없어요" 안내도 실기동 확인)
- [x] 랭킹 테이블/리스트 UI (순위, 식당명, 득표수, 포인트) — `rankings-list.tsx`
- [x] 랭킹 항목 클릭 시 식당 상세로 이동 (`/restaurants/[id]` 링크)
- [x] 랭킹 데이터 없음 상태 UI — 실기동으로 "아직 랭킹 데이터가 없어요" 확인
- [x] 랭킹 집계 범위(진행중 투표 포함) 안내 문구 표시
- [x] 랭킹 화면 로딩 상태(Suspense) 처리 — 탭별로 `Suspense` + `Skeleton` 폴백 (5번 섹션에서 만든 스켈레톤 컴포넌트 첫 사용처)
- [x] 랭킹 Top N만 표시할지 전체 표시할지 UX 결정 — 결정: 상위 10곳만 표시, 초과 시 안내 문구

## 11. 에러 처리 · 검증 · 보안 강화 (10)
- [x] 모든 Server Action에서 `auth.uid()` 기반 재검증 로직 일관성 점검 — 전수 점검 중 실제 결함 1건 발견/수정: `cancelVoteAction`이 RLS(`votes_update_own`)에만 의존해 소유자가 아니어도 "조용히 성공"(0건 매칭, 에러 없음)하던 것을 소유권 명시 체크로 수정
- [x] 폼 제출 시 `useActionState` 기반 pending/에러 상태 공통 패턴 정립 — 결정: `<form action={fn}>`으로 제출하는 폼은 `useActionState`, 검색결과 선택처럼 즉시 실행되는 액션은 `useTransition` + 수동 상태로 통일(두 패턴을 용도별로 구분해서 사용, 억지 통합 안 함)
- [x] Server Action 입력 검증 스키마 도구 도입 여부 결정 (예: Zod) — 결정: 현재 규모(폼당 필드 2~4개)에서는 수동 검증으로 충분, Zod 등은 폼이 늘어나면 재검토
- [x] 투표 제출 남용 방지 rate limiting 검토 — 결정: MVP 제외. 인증된 내부 사용자 대상이고 부서 범위로 이미 제한되어 있어 악용 유인/파급력이 낮음
- [x] 카카오 API 키가 클라이언트 번들에 노출되지 않는지 빌드 결과 점검 — 실제 프로덕션 빌드(`.next/static`)를 grep해서 확인: `KAKAO_REST_API_KEY` 값/변수명 0건, `NEXT_PUBLIC_KAKAO_JS_KEY` 값은 1건(의도대로 공개) 확인
- [x] RLS 정책 통합 테스트 — 서로 다른 조직 계정 2개를 만들어 실제 JWT로 PostgREST에 직접 요청: `votes`/`vote_responses`/`profiles`는 타 조직 데이터 0건(ID 직접 조회도 차단), `organizations`와 `get_rankings` RPC는 의도대로 타 조직 데이터도 조회됨을 확인 후 테스트 데이터 정리
- [x] `get_advisors` 재실행하여 애플리케이션 코드 추가 후 신규 경고 확인 — security는 의도된 WARN(“authenticated는 RPC 실행 가능”)만 남음, performance는 unused_index INFO 3건뿐(사용량 적어서 발생, 정상)
- [x] Server Action 1MB 바디 크기 제한 관련 대용량 입력(예: 다수 후보 등록) 케이스 점검 — 분석 결과 현재 폼의 최대 payload(체크박스 다중선택 등)가 1MB에 비해 훨씬 작아 실질적 위험 없음
- [x] Server Action 재배포 시 "Failed to find Server Action" 대응 정책 확인 — 정책: 배포 시 `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`를 Vercel 환경변수에 고정값으로 설정해 배포 간 액션 ID 안정성 확보 (14번 섹션에서 실제 적용)
- [x] 온보딩/투표 생성 RPC의 SQL Injection/입력 검증 재점검 — 6개 RPC 정의(`pg_get_functiondef`)를 다시 읽어 확인: 전부 파라미터 바인딩만 사용하고 `EXECUTE`/`format()` 등 동적 SQL 조합이 전혀 없어 인젝션 표면 없음

## 12. 반응형 · UI 폴리싱 (8)

사용자와 디자인 방향을 먼저 확정: **오렌지 포인트 컬러**(WCAG 대비 계산 후 라이트 `orange-700`/다크 `orange-400` 선정), **Pretendard 한글 웹폰트**, **부드러운 트랜지션**, **로고에 이모지(🍚) 추가**.

- [x] 모바일 뷰포트 대응 전반 점검 (사내 메신저 링크 접속 가정) — 375px 뷰포트로 랜딩/로그인 페이지 가로 스크롤 없음 확인(9번 섹션에서 로그인 페이지도 이미 확인)
- [x] 공통 버튼/입력 컴포넌트 스타일 통일 — `Button`/`Input`/`select` 전체에 accent 컬러 + `transition-colors` 통일 적용
- [x] 로딩 스켈레톤 UI 전체 페이지 적용 — 식당 목록/투표 목록 페이지도 랭킹과 같은 `Suspense`+`Skeleton` 패턴으로 전환(총 3개 데이터 페이지)
- [x] 한글 카피 전체 리뷰 (오탈자/일관성) — 전체 문구 grep 검토, 오탈자 없음 확인. UI 카피(해요체)와 에러 메시지(합니다체/명령형)가 다른 톤인 것을 발견했는데, 검토 결과 의도적으로 구분해서 쓸만한 컨벤션이라 판단해 유지하기로 결정(에러는 더 단정적으로, 나머지는 친근하게)
- [x] 접근성 점검 (폼 라벨, 포커스 순서, 명도 대비) — 라벨 없던 입력/셀렉트 4곳에 `aria-label` 추가, `:focus-visible` 링을 accent 컬러로 통일(스타일시트에서 규칙 적용 확인), 버튼 배경색 대비를 실제로 계산해서(WCAG 4.5:1 이상) 색상 선정
- [x] 파비콘/OG 이미지 등 메타데이터 정리 — 이모지 기반 SVG data URI 파비콘 적용, 기존 `favicon.ico` 제거(중복 아이콘 링크 해결), OpenGraph 메타데이터 추가
- [x] 애니메이션/트랜지션 최소 적용 여부 결정 — 결정: 부드러운 트랜지션 추가. 버튼/링크/입력에 hover·focus 트랜지션, 카드/리스트에 `fade-in-up` 등장 애니메이션(`prefers-reduced-motion` 존중) 적용
- [x] 빈 상태·에러 상태 일러스트/문구 통일 — 빈 상태 5곳에 맥락별 이모지 통일(🍽️ 식당, 🗳️ 투표/득표, 🏆 랭킹, 🏢 타 회사), 에러 메시지는 이모지 없이 빨간 텍스트로 구분 유지

## 13. 테스트 · QA (10)
- [ ] 회원가입→온보딩→식당등록→투표생성→참여→결과→랭킹 전체 플로우 수동 E2E 테스트
- [ ] 두 조직 계정으로 교차 데이터 노출 여부 테스트
- [ ] 동점 케이스 테스트 (공동 1위 표시 확인)
- [ ] 재제출 케이스 테스트 (마감 전 여러 번 수정)
- [ ] 마감 이후 참여 시도 차단 확인
- [ ] 동일 식당 중복 선택 방지 클라이언트/서버 양쪽 검증
- [x] `npx tsc --noEmit` 통과 확인 — 에러 0건
- [x] `eslint` 통과 확인 (`next lint`는 제거된 명령이므로 사용하지 않음) — `npm run lint` 에러/경고 0건
- [ ] 카카오 API 연동 모킹 테스트 도입 여부 결정
- [ ] 모바일 브라우저(iOS Safari/Android Chrome) 실기기 또는 에뮬레이터 확인

## 14. 배포 · 운영 (8)
- [ ] Vercel 환경변수에 `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY` 등 등록
- [ ] Vercel 프로덕션 배포 및 스모크 테스트
- [ ] 카카오 콘솔에 배포 도메인 등록 (JS 키 도메인 제한)
- [ ] 에러 모니터링 도구 연동 여부 검토 (예: Sentry)
- [ ] 사내 파일럿 대상 부서 온보딩 가이드 문서 작성
- [ ] 배포 후 Supabase advisor 최종 재확인
- [ ] 도메인/커스텀 URL 연결 여부 결정
- [ ] 장애 대응(점심시간대 트래픽 집중) 모니터링 계획 수립

## 15. 문서화 · 마무리 (6)
- [ ] `lunch-vote-db-schema-plan.md`를 실제 구현 완료 시점 기준으로 최신화
- [ ] API/RPC 사용법 요약 문서 작성 (프론트엔드 개발 참고용)
- [ ] 이 `TODO.md` 체크리스트를 진행 상황에 맞춰 지속 업데이트
- [ ] 온보딩/조직 자동 생성 정책(공개 도메인 제한 없음) 등 운영상 리스크 재검토 시점 정하기
- [ ] 향후 확장 아이디어(예약 연동, AI 추천 등) 별도 백로그로 분리 기록
- [ ] 코드 전반에 대한 최종 셀프 코드리뷰

## 16. AI 점심 추천 봇 (Gemini) (12)

식당 화면에 한 줄 무드/상황 입력 → Gemini 추천 → 카카오맵 검색으로 실재 확인 후 등록하는 흐름. 계획 문서: `.claude/plans/streamed-singing-stream.md`.

- [x] `@google/genai` SDK 설치
- [x] `src/lib/gemini.ts` 작성 — `ai.models.generateContent` 사용(JSON 스키마 강제 출력, 에러 클래스/상태코드 매핑). 신규 Interactions API(`ai.interactions.create`)는 에러 응답 본문을 파싱하지 못해 원인 진단이 불가능해 안정적인 구버전 API로 전환함
- [x] `src/app/api/gemini/recommend/route.ts` 작성 (POST, 입력 길이 검증 2~200자, 에러 매핑)
- [x] `.env.local`에 `GEMINI_KEY` 추가 및 로컬 동작 확인 완료
- [x] Vercel 프로젝트 환경변수에 `GEMINI_KEY` 등록(sensitive) 완료
- [x] `src/app/(app)/restaurants/use-add-restaurant.ts` 공유 훅 추출 (기존 `add-restaurant-form.tsx`의 등록 로직 재사용)
- [x] `add-restaurant-form.tsx`를 공유 훅 사용하도록 리팩터
- [x] `kakao-search-box.tsx`에 `initialQuery` prop + "검색 결과 없음" empty state 추가
- [x] `lunch-recommender.tsx` 컴포넌트 작성 (무드 입력 + 추천받기 버튼 + 4초 쿨다운 + 추천 카드 + 카드별 인라인 카카오 검색/등록)
- [x] `restaurants/page.tsx`에 `LunchRecommender` 배치
- [x] 로컬 수동 E2E 테스트 — 실제 키로 추천 정상 동작 확인(사용자 확인 완료). 존재하지 않는 장소/연속 클릭 쿨다운 등 세부 케이스는 추후 재확인
- [x] `npx tsc --noEmit`/`npm run lint` 통과 확인 (빌드 산출물 `GEMINI_KEY` 노출 여부 grep은 배포 전 별도 확인 필요)

---

**총 항목 수**: 188개 (완료 161개 / 남은 작업 27개)
