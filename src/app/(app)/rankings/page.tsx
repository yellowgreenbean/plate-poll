import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/skeleton";
import { RankingsList, type RankingRow } from "./rankings-list";

type Tab = "dept" | "org" | "other";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; org?: string }>;
}) {
  const { tab: tabParam, org: orgParam } = await searchParams;
  const tab: Tab = tabParam === "org" || tabParam === "other" ? tabParam : "dept";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, dept_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const { data: otherOrgs } = await supabase
    .from("organizations")
    .select("id, name")
    .neq("id", profile.org_id)
    .order("name");

  const selectedOrgId = orgParam ?? otherOrgs?.[0]?.id ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">랭킹</h1>
        <p className="text-sm text-neutral-500">
          진행 중인 투표를 포함한 누적 득표 기준이에요.
        </p>
      </div>

      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <TabLink href="/rankings?tab=dept" active={tab === "dept"}>
          우리 부서
        </TabLink>
        <TabLink href="/rankings?tab=org" active={tab === "org"}>
          우리 회사
        </TabLink>
        <TabLink
          href={`/rankings?tab=other${selectedOrgId ? `&org=${selectedOrgId}` : ""}`}
          active={tab === "other"}
        >
          타 회사
        </TabLink>
      </div>

      {tab === "other" && (otherOrgs ?? []).length > 0 && (
        <form action="/rankings" method="get" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="tab" value="other" />
          <select
            name="org"
            aria-label="타 회사 선택"
            defaultValue={selectedOrgId ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm transition-colors duration-150 focus:border-accent dark:border-neutral-700 dark:bg-neutral-900"
          >
            {(otherOrgs ?? []).map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="ghost">
            보기
          </Button>
        </form>
      )}

      {tab === "other" && (otherOrgs ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">🏢 아직 다른 회사가 없어요.</p>
      ) : (
        <Suspense key={`${tab}-${selectedOrgId}`} fallback={<RankingsSkeleton />}>
          <RankingsData
            tab={tab}
            deptId={profile.dept_id}
            orgId={profile.org_id}
            otherOrgId={selectedOrgId}
          />
        </Suspense>
      )}
    </div>
  );
}

async function RankingsData({
  tab,
  deptId,
  orgId,
  otherOrgId,
}: {
  tab: Tab;
  deptId: string;
  orgId: string;
  otherOrgId: string | null;
}) {
  const supabase = await createClient();

  let results: RankingRow[] = [];

  if (tab === "dept") {
    const { data } = await supabase.rpc("get_rankings", {
      p_scope: "dept",
      p_dept_id: deptId,
    });
    results = data ?? [];
  } else if (tab === "org") {
    const { data } = await supabase.rpc("get_rankings", {
      p_scope: "org",
      p_org_id: orgId,
    });
    results = data ?? [];
  } else if (tab === "other" && otherOrgId) {
    const { data } = await supabase.rpc("get_rankings", {
      p_scope: "org",
      p_org_id: otherOrgId,
    });
    results = data ?? [];
  }

  return <RankingsList results={results ?? []} />;
}

function RankingsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm transition-colors duration-150 ${
        active
          ? "border-b-2 border-accent font-semibold text-accent"
          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      }`}
    >
      {children}
    </Link>
  );
}
