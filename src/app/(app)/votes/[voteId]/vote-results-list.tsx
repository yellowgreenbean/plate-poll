type VoteResult = {
  restaurant_id: number;
  restaurant_name: string;
  total_points: number;
  total_votes: number;
  rnk: number;
};

export function VoteResultsList({ results }: { results: VoteResult[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-neutral-500">아직 득표 결과가 없어요.</p>;
  }

  const maxPoints = Math.max(1, ...results.map((result) => result.total_points));
  const winnerCount = results.filter((result) => result.rnk === 1).length;

  return (
    <ul className="flex flex-col gap-3">
      {results
        .slice()
        .sort((a, b) => a.rnk - b.rnk)
        .map((result) => {
          const isWinner = result.rnk === 1 && result.total_points > 0;
          const widthPercent = (result.total_points / maxPoints) * 100;
          return (
            <li key={result.restaurant_id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className={isWinner ? "font-bold" : "font-medium"}>
                  {result.restaurant_name}
                  {isWinner && (
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      {winnerCount > 1 ? "공동 1위" : "1위"}
                    </span>
                  )}
                </span>
                <span className="text-neutral-500">
                  {result.total_points}점 · {result.total_votes}표
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div
                  className="h-2 rounded-full bg-neutral-900 dark:bg-neutral-100"
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </li>
          );
        })}
    </ul>
  );
}
