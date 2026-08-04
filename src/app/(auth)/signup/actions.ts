"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { translateSupabaseAuthError } from "@/lib/auth-errors";

export type SignupActionState = {
  error: string | null;
  success: boolean;
};

export async function signUpAction(
  _prevState: SignupActionState,
  formData: FormData
): Promise<SignupActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "올바른 이메일 주소를 입력해주세요.", success: false };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다.", success: false };
  }

  const origin =
    process.env.SITE_URL ??
    (await headers()).get("origin") ??
    "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: translateSupabaseAuthError(error.message), success: false };
  }

  return { error: null, success: true };
}
