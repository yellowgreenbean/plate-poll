"use client";

import { useActionState } from "react";
import { completeSignupAction, type OnboardingActionState } from "./actions";

const initialState: OnboardingActionState = { error: null };

type Department = { id: string; name: string };

export function OnboardingForm({
  domain,
  organizationName,
  departments,
}: {
  domain: string;
  organizationName: string | null;
  departments: Department[];
}) {
  const [state, formAction, isPending] = useActionState(completeSignupAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-neutral-500">소속 회사</p>
        {organizationName ? (
          <p className="font-medium">{organizationName}</p>
        ) : (
          <p className="font-medium">{domain} — 새로운 회사로 등록됩니다</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="홍길동"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      {departments.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="dept_id" className="text-sm font-medium">
            부서 선택
          </label>
          <select
            id="dept_id"
            name="dept_id"
            defaultValue=""
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">-- 선택 안 함 --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="new_dept_name" className="text-sm font-medium">
          {departments.length > 0 ? "또는 새 부서 만들기" : "부서명"}
        </label>
        <input
          id="new_dept_name"
          name="new_dept_name"
          type="text"
          placeholder="예: 개발팀"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {isPending ? "처리 중..." : "시작하기"}
      </button>
    </form>
  );
}
