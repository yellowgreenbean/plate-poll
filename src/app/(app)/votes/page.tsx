import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

type VoteListItem = {
  id: string;
  title: string | null;
  closes_at: string;
  status: string;
  isClosed: boolean;
};

export default async function VotesPage() {
  const supabase = await createClient();

  const { data: votes } = await supabase
    .from("votes")
    .select("id, title, closes_at, status, created_at")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line react-hooks/purity -- Server Component renders fresh per request, unlike a re-rendered client component
  const now = Date.now();
  const withStatus: VoteListItem[] = (votes ?? []).map((vote) => ({
    id: vote.id,
    title: vote.title,
    closes_at: vote.closes_at,
    status: vote.status,
    isClosed: vote.status === "cancelled" || new Date(vote.closes_at).getTime() <= now,
  }));

  const openVotes = withStatus
    .filter((vote) => !vote.isClosed)
    .sort((a, b) => new Date(a.closes_at).getTime() - new Date(b.closes_at).getTime());
  const closedVotes = withStatus
    .filter((vote) => vote.isClosed)
    .sort((a, b) => new Date(b.closes_at).getTime() - new Date(a.closes_at).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">투표</h1>
          <p className="text-sm text-neutral-500">우리 부서의 점심 투표 목록이에요.</p>
        </div>
        <Link href="/votes/new">
          <Button type="button">새 투표 만들기</Button>
        </Link>
      </div>

      {withStatus.length === 0 ? (
        <p className="text-sm text-neutral-500">
          아직 투표가 없어요. &quot;새 투표 만들기&quot;로 첫 투표를 시작해보세요.
        </p>
      ) : (
        <>
          {openVotes.length > 0 && <VoteGroup title="진행중" votes={openVotes} />}
          {closedVotes.length > 0 && <VoteGroup title="마감됨" votes={closedVotes} />}
        </>
      )}
    </div>
  );
}

function VoteGroup({ title, votes }: { title: string; votes: VoteListItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-neutral-500">{title}</h2>
      <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
        {votes.map((vote) => (
          <li key={vote.id} className="py-3">
            <Link href={`/votes/${vote.id}`} className="flex flex-col gap-1">
              <span className="font-medium">{vote.title || "제목 없는 투표"}</span>
              <span className="text-xs text-neutral-500">
                {vote.status === "cancelled"
                  ? "취소됨"
                  : `마감 ${new Date(vote.closes_at).toLocaleString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
