"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error: string | null;
};

export async function submitVoteResponseAction(
  voteId: string,
  optionIds: string[]
): Promise<ActionState> {
  if (optionIds.length === 0 || optionIds.length > 3) {
    return { error: "1~3곳을 선택해주세요." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.rpc("submit_vote_response", {
    p_vote_id: voteId,
    p_option_ids: optionIds,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/votes/${voteId}`);
  return { error: null };
}

export async function cancelVoteAction(voteId: string): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // RLS(votes_update_own)만 믿으면 소유자가 아닐 때 update가 0건 매칭으로 "조용히 성공"해버리므로,
  // 클라이언트가 액션을 직접 호출하는 경우를 대비해 소유권을 명시적으로 재확인한다.
  const { data: vote } = await supabase
    .from("votes")
    .select("created_by")
    .eq("id", voteId)
    .maybeSingle();

  if (!vote) {
    return { error: "투표를 찾을 수 없습니다." };
  }
  if (vote.created_by !== user.id) {
    return { error: "투표 생성자만 취소할 수 있습니다." };
  }

  const { error } = await supabase
    .from("votes")
    .update({ status: "cancelled" })
    .eq("id", voteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/votes/${voteId}`);
  revalidatePath("/votes");
  return { error: null };
}
