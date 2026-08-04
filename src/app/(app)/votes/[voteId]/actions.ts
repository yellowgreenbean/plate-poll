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
