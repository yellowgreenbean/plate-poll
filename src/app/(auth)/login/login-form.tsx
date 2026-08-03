"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type LoginActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: LoginActionState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          이메일
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
          autoComplete="current-password"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "로그인 중..." : "로그인"}
      </Button>
      <p className="text-center text-sm text-neutral-500">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
