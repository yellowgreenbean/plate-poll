import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VoteParticipateForm, type VoteOptionItem } from "./vote-participate-form";
import { VoteResultsList } from "./vote-results-list";
import { CancelVoteButton } from "./cancel-vote-button";
import { CopyLinkButton } from "./copy-link-button";
import { CountdownBadge } from "./countdown-badge";

export default async function VoteDetailPage({
  params,
}: {
  params: Promise<{ voteId: string }>;
}) {
  const { voteId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: vote } = await supabase
    .from("votes")
    .select("id, title, closes_at, status, created_by")
    .eq("id", voteId)
    .maybeSingle();

  if (!vote) {
    notFound();
  }

  // eslint-disable-next-line react-hooks/purity -- Server Component renders fresh per request, unlike a re-rendered client component
  const isClosed = vote.status === "cancelled" || new Date(vote.closes_at).getTime() <= Date.now();
  const isOwner = vote.created_by === user.id;

  const [{ data: voteOptions }, { data: myResponses }, { data: results }] = await Promise.all([
    supabase
      .from("vote_options")
      .select("id, restaurant_id, restaurants(name, category)")
      .eq("vote_id", voteId)
      .order("id"),
    supabase
      .from("vote_responses")
      .select("option_id, rank")
      .eq("vote_id", voteId)
      .eq("user_id", user.id)
      .order("rank"),
    supabase.rpc("get_vote_results", { p_vote_id: voteId }),
  ]);

  const options: VoteOptionItem[] = (voteOptions ?? []).map((option) => ({
    id: option.id,
    restaurantId: option.restaurant_id,
    name: option.restaurants?.name ?? "알 수 없는 식당",
    category: option.restaurants?.category ?? null,
  }));

  const initialOptionIds = (myResponses ?? []).map((response) => response.option_id);
  const hasVoted = initialOptionIds.length > 0;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold">{vote.title || "제목 없는 투표"}</h1>
          <CopyLinkButton />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <span>
            마감:{" "}
            {new Date(vote.closes_at).toLocaleString("ko-KR", {
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {vote.status === "cancelled" ? (
            <span className="font-medium text-red-600">취소된 투표</span>
          ) : isClosed ? (
            <span className="font-medium">마감됨</span>
          ) : (
            <CountdownBadge closesAt={vote.closes_at} />
          )}
        </div>
        {isOwner && !isClosed && <CancelVoteButton voteId={vote.id} />}
      </div>

      {!isClosed ? (
        <div className="flex flex-col gap-2">
          {hasVoted && (
            <p className="text-sm text-neutral-500">
              이미 참여했어요. 마감 전까지 다시 선택할 수 있어요.
            </p>
          )}
          <VoteParticipateForm
            voteId={vote.id}
            options={options}
            initialOptionIds={initialOptionIds}
          />
        </div>
      ) : (
        hasVoted && <p className="text-sm text-neutral-500">참여해주셔서 감사해요.</p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-500">득표 현황</h2>
        <VoteResultsList results={results ?? []} />
      </div>
    </div>
  );
}
