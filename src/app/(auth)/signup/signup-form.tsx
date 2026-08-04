"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type SignupActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: SignupActionState = { error: null, success: false };

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-2 text-center">
        <p className="font-medium">이메일을 확인해주세요</p>
        <p className="text-sm text-neutral-500">
          입력하신 이메일 주소로 인증 링크를 보냈습니다. 메일함에서 링크를 눌러 가입을
          완료해주세요.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          회사 이메일
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8자 이상"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "가입 중..." : "회원가입"}
      </Button>
      <p className="text-center text-sm text-neutral-500">
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          className="font-medium text-accent underline transition-colors duration-150 hover:text-accent-hover"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}
