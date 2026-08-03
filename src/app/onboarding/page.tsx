import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";
import { Card } from "@/components/ui/card";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect("/votes");
  }

  const domain = user.email.split("@")[1];

  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("email_domain", domain)
    .maybeSingle();

  const departments = organization
    ? (
        await supabase
          .from("departments")
          .select("id, name")
          .eq("org_id", organization.id)
          .order("name")
      ).data ?? []
    : [];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">소속 확인</h1>
        <p className="text-sm text-neutral-500">
          부서를 선택하면 팀 투표를 바로 시작할 수 있어요
        </p>
      </div>
      <Card>
        <OnboardingForm
          domain={domain}
          organizationName={organization?.name ?? null}
          departments={departments}
        />
      </Card>
    </div>
  );
}
