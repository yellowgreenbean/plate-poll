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
- [ ] TypeScript strict 모드 유지 확인 (`tsconfig.json` 재검토)
- [ ] ESLint 규칙이 App Router/Server Action 패턴에 맞는지 점검
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
- [ ] `vote_responses.points` generated 컬럼이 의도대로 계산되는지 샘플 데이터로 검증
- [ ] Supabase 대시보드에서 백업/PITR 정책 확인
- [ ] 두 조직 테스트 계정으로 실제 RLS 교차 접근 시나리오 수동 검증 (다른 조직의 vote_responses/profiles 비노출 확인)

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
- [ ] 로그아웃 Server Action + 네비게이션 바 연결 — `signOutAction`(`src/app/(auth)/actions.ts`)은 작성 완료, 네비게이션 바는 5번 섹션에서 연결 예정
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
- [ ] 카카오 디벨로퍼스 앱 등록 및 REST/JS 키 발급 (사용자 액션 필요 — 안내 문서화)
- [ ] `.env.local`에 `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_JS_KEY` 추가
- [ ] `src/lib/kakao.ts` 작성 — 키워드 장소 검색 함수 (서버 전용)
- [ ] `src/app/api/kakao/search/route.ts` 작성 (GET, 검색어 파라미터, `KAKAO_REST_API_KEY` 사용)
- [ ] 카카오 API 에러/쿼터 초과 처리 및 사용자 안내 메시지
- [ ] 검색 결과 캐싱 전략 검토 (호출량 절감, 리스크 관리)
- [ ] 클라이언트 검색창 컴포넌트 (디바운스 + `AbortController`로 이전 요청 취소)
- [ ] 검색 결과 리스트 UI (이름/주소/카테고리 표시)
- [ ] `next/script`로 Kakao Maps JS SDK 로드
- [ ] 지도 임베드 컴포넌트 (`KakaoMapEmbed`, lat/lng 마커 표시)
- [ ] JS 키 도메인 제한 설정 안내 (카카오 콘솔, 배포 도메인 등록 포함)
- [ ] 검색 API 요청 속도 제한/디바운스 서버측 방어 검토
- [ ] 카카오 응답 필드 매핑 유틸 작성 (place_name→name, x/y→lng/lat 등)
- [ ] 별점 필드 부재에 대한 UI 문구 확정 ("카카오맵에서 별점 보기" 링크)

## 7. 식당 풀 화면 (12)
- [ ] `src/app/(app)/restaurants/page.tsx` 작성 (등록된 식당 목록)
- [ ] `src/app/(app)/restaurants/add/actions.ts` — `addRestaurantAction` (`kakao_place_id` 기준 upsert)
- [ ] 식당 추가 폼 UI (검색 결과에서 "추가" 버튼)
- [ ] 중복 추가 방지 UX (이미 등록된 식당은 "추가됨" 표시)
- [ ] `src/app/(app)/restaurants/[id]/page.tsx` 작성 (상세 화면)
- [ ] 상세 화면에 "카카오맵에서 별점 보기" 링크 (`place_url`)
- [ ] 상세 화면 지도 임베드 연결
- [ ] 식당 목록 검색/필터 UI (이름 검색)
- [ ] 빈 목록 상태 UI ("아직 등록된 식당이 없어요")
- [ ] 식당 카테고리별 필터/정렬 UI
- [ ] 식당 등록자 표시 (`created_by` → 프로필 이름)
- [ ] 식당 목록 페이지네이션/무한 스크롤 필요 여부 결정

## 8. 투표 생성 (10)
- [ ] `src/app/(app)/votes/new/page.tsx` 작성
- [ ] 후보 식당 다중 선택 UI (체크박스/칩 리스트, 식당 풀에서 선택)
- [ ] 마감 시각(`closes_at`) 선택 UI (datetime picker)
- [ ] `src/app/(app)/votes/new/actions.ts` — `createVoteAction` (`create_vote` RPC 호출)
- [ ] 투표 생성 폼 검증 (최소 1개 후보, 마감시각이 현재보다 미래인지)
- [ ] 생성 성공 시 `/votes/[voteId]`로 리다이렉트
- [ ] 투표 제목(`title`) 선택 입력 필드
- [ ] 후보 식당이 없을 때 "먼저 식당을 등록해주세요" 안내 및 링크
- [ ] 마감 시각 기본값(예: 당일 11:30) 프리셋 제공
- [ ] 투표 생성 권한(같은 부서 소속) 서버측 재검증

## 9. 투표 참여 · 결과 화면 (18)
- [ ] `src/app/(app)/votes/page.tsx` 작성 (우리 부서 투표 목록, 진행중/마감 구분 표시)
- [ ] `src/app/(app)/votes/[voteId]/page.tsx` 작성 — 서버에서 `get_vote_results` 호출
- [ ] 1지망/2지망/3지망 선택 UI (순차 선택, 최대 3개, 동일 식당 중복 방지)
- [ ] `src/app/(app)/votes/[voteId]/actions.ts` — `submitVoteResponseAction` (`submit_vote_response` RPC)
- [ ] 재제출(마감 전 자유 수정) UX — 기존 선택값 미리 채워서 보여주기
- [ ] 마감 여부(`is_closed`) 계산 결과에 따라 참여 폼 vs 결과 전용 화면 분기
- [ ] 득표 결과 갱신 전략 결정 (polling 주기 또는 서버 컴포넌트 재검증 방식)
- [ ] 득표 결과 막대그래프/시각화 컴포넌트
- [ ] 공동 1위 표시 UI (`rnk=1`인 항목 여러 개 강조)
- [ ] `cancelVoteAction` — 투표 생성자가 투표 취소(`status='cancelled'`)
- [ ] 투표 취소 확인 다이얼로그
- [ ] 투표 링크 공유 기능 (URL 복사 버튼)
- [ ] 이미 투표한 사용자에게 "내 선택" 안내 문구 표시
- [ ] 참여 폼에서 선택 순서(지망) 드래그 정렬 또는 순번 버튼 UX 확정
- [ ] 투표 참여자 수/총원 대비 참여율 표시 여부 결정
- [ ] 마감 임박 알림/카운트다운 UI
- [ ] 존재하지 않거나 접근 권한 없는 `voteId` 접근 시 404/에러 처리
- [ ] 투표 결과 화면 모바일 레이아웃 점검

## 10. 랭킹 화면 (12)
- [ ] `src/app/(app)/rankings/page.tsx` 작성
- [ ] `searchParams` 기반 탭 전환 (우리 부서/우리 회사/타 회사) — Next 16 `await searchParams` 반영
- [ ] 우리 부서 랭킹 조회 (`get_rankings` scope='dept')
- [ ] 우리 회사 랭킹 조회 (`get_rankings` scope='org')
- [ ] 타 회사 선택 UI (조직 목록 드롭다운, `organizations` SELECT 활용)
- [ ] 타 회사 랭킹 조회 및 표시
- [ ] 랭킹 테이블/리스트 UI (순위, 식당명, 득표수, 포인트)
- [ ] 랭킹 항목 클릭 시 식당 상세로 이동
- [ ] 랭킹 데이터 없음 상태 UI
- [ ] 랭킹 집계 범위(진행중 투표 포함) 안내 문구 표시
- [ ] 랭킹 화면 로딩 상태(Suspense) 처리
- [ ] 랭킹 Top N만 표시할지 전체 표시할지 UX 결정

## 11. 에러 처리 · 검증 · 보안 강화 (10)
- [ ] 모든 Server Action에서 `auth.uid()` 기반 재검증 로직 일관성 점검
- [ ] 폼 제출 시 `useActionState` 기반 pending/에러 상태 공통 패턴 정립
- [ ] Server Action 입력 검증 스키마 도구 도입 여부 결정 (예: Zod)
- [ ] 투표 제출 남용 방지 rate limiting 검토
- [ ] 카카오 API 키가 클라이언트 번들에 노출되지 않는지 빌드 결과 점검
- [ ] RLS 정책 통합 테스트 — 타 조직 계정으로 `votes`/`vote_responses`/`profiles` 교차 접근 시도
- [ ] `get_advisors` 재실행하여 애플리케이션 코드 추가 후 신규 경고 확인
- [ ] Server Action 1MB 바디 크기 제한 관련 대용량 입력(예: 다수 후보 등록) 케이스 점검
- [ ] Server Action 재배포 시 "Failed to find Server Action" 대응 정책 확인 (encryption key 로테이션)
- [ ] 온보딩/투표 생성 RPC의 SQL Injection/입력 검증 재점검 (RPC 파라미터 바인딩 기반이라 안전한지 재확인)

## 12. 반응형 · UI 폴리싱 (8)
- [ ] 모바일 뷰포트 대응 전반 점검 (사내 메신저 링크 접속 가정)
- [ ] 공통 버튼/입력 컴포넌트 스타일 통일
- [ ] 로딩 스켈레톤 UI 전체 페이지 적용
- [ ] 한글 카피 전체 리뷰 (오탈자/일관성)
- [ ] 접근성 점검 (폼 라벨, 포커스 순서, 명도 대비)
- [ ] 파비콘/OG 이미지 등 메타데이터 정리
- [ ] 애니메이션/트랜지션 최소 적용 여부 결정
- [ ] 빈 상태·에러 상태 일러스트/문구 통일

## 13. 테스트 · QA (10)
- [ ] 회원가입→온보딩→식당등록→투표생성→참여→결과→랭킹 전체 플로우 수동 E2E 테스트
- [ ] 두 조직 계정으로 교차 데이터 노출 여부 테스트
- [ ] 동점 케이스 테스트 (공동 1위 표시 확인)
- [ ] 재제출 케이스 테스트 (마감 전 여러 번 수정)
- [ ] 마감 이후 참여 시도 차단 확인
- [ ] 동일 식당 중복 선택 방지 클라이언트/서버 양쪽 검증
- [ ] `npx tsc --noEmit` 통과 확인
- [ ] `eslint` 통과 확인 (`next lint`는 제거된 명령이므로 사용하지 않음)
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

---

**총 항목 수**: 약 200개 (완료 71개 / 남은 작업 약 129개)
