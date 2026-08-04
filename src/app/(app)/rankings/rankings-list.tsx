import Link from "next/link";

export type RankingRow = {
  restaurant_id: number;
  restaurant_name: string;
  total_points: number;
  total_votes: number;
  rnk: number;
};

const TOP_N = 10;

export function RankingsList({ results }: { results: RankingRow[] }) {
  if (results.length === 0) {
    return (
      <p className="animate-fade-in text-sm text-neutral-500">
        🏆 아직 랭킹 데이터가 없어요.
      </p>
    );
  }

  const sorted = results.slice().sort((a, b) => a.rnk - b.rnk);
  const visible = sorted.slice(0, TOP_N);

  return (
    <div className="animate-fade-in flex flex-col gap-2">
      <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
        {visible.map((row) => {
          const isTop = row.rnk === 1;
          return (
            <li key={row.restaurant_id}>
              <Link
                href={`/restaurants/${row.restaurant_id}`}
                className="group flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-sm font-semibold ${isTop ? "text-accent" : "text-neutral-500"}`}
                  >
                    {row.rnk}
                  </span>
                  <span
                    className={`text-sm transition-colors duration-150 group-hover:text-accent ${isTop ? "font-bold" : "font-medium"}`}
                  >
                    {row.restaurant_name}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {row.total_points}점 · {row.total_votes}표
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {sorted.length > TOP_N && (
        <p className="text-xs text-neutral-400">상위 {TOP_N}곳만 표시하고 있어요.</p>
      )}
    </div>
  );
}
