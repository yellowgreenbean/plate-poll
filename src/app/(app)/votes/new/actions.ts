"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateVoteState = {
  error: string | null;
};

export async function createVoteAction(
  _prevState: CreateVoteState,
  formData: FormData
): Promise<CreateVoteState> {
  const title = String(formData.get("title") ?? "").trim();
  const closesAtRaw = String(formData.get("closes_at") ?? "");
  const restaurantIds = formData.getAll("restaurant_ids").map((value) => Number(String(value)));

  if (restaurantIds.length === 0 || restaurantIds.some((id) => Number.isNaN(id))) {
    return { error: "후보 식당을 1곳 이상 선택해주세요." };
  }

  const closesAt = new Date(closesAtRaw);
  if (Number.isNaN(closesAt.getTime())) {
    return { error: "마감 시각을 올바르게 입력해주세요." };
  }
  if (closesAt.getTime() <= Date.now()) {
    return { error: "마감 시각은 현재보다 이후여야 합니다." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: vote, error } = await supabase.rpc("create_vote", {
    p_title: title,
    p_closes_at: closesAt.toISOString(),
    p_restaurant_ids: restaurantIds,
  });

  if (error || !vote) {
    return { error: error?.message ?? "투표 생성에 실패했습니다." };
  }

  redirect(`/votes/${vote.id}`);
}
