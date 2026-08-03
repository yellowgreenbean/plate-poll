"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingActionState = {
  error: string | null;
};

export async function completeSignupAction(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const deptId = String(formData.get("dept_id") ?? "").trim();
  const newDeptName = String(formData.get("new_dept_name") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!deptId && !newDeptName) {
    return { error: "기존 부서를 선택하거나 새 부서 이름을 입력해주세요." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("complete_signup", {
    p_dept_id: deptId || undefined,
    p_new_dept_name: newDeptName || undefined,
    p_name: name || undefined,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/votes");
}
