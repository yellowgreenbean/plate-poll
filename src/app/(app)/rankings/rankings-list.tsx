import Link from "next/link";

export type RankingRow = {
  restaurant_id: number;
  restaurant_name: string;
  total_points: number;
  total_votes: number;
  rnk: number;
};

const TOP_N = 10;

const CATEGORY_EMOJI: { keywords: string[]; emoji: string }[] = [
  { keywords: ["한식", "국밥", "찌개", "국수", "칼국수", "백반", "보쌈"], emoji: "🍚" },
  { keywords: ["중식", "짜장", "짬뽕", "만두"], emoji: "🥟" },
  { keywords: ["일식", "스시", "초밥", "라멘", "돈까스", "우동"], emoji: "🍣" },
  { keywords: ["양식", "파스타", "스테이크", "피자"], emoji: "🍝" },
  { keywords: ["카페", "커피", "디저트", "베이커리", "빵"], emoji: "☕" },
  { keywords: ["치킨"], emoji: "🍗" },
  { keywords: ["분식", "김밥", "떡볶이"], emoji: "🍢" },
  { keywords: ["고기", "삼겹살", "갈비", "곱창"], emoji: "🥩" },
];

function getFoodEmoji(category: string | null, name: string): string {
  const haystack = `${category ?? ""} ${name}`;
  for (const { keywords, emoji } of CATEGORY_EMOJI) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return emoji;
    }
  }
  return "🍽️";
}

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
  const [first, ...rest] = visible;

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {first && <FirstPlaceCard row={first} />}

      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rest.map((row) => (
            <RankCard key={row.restaurant_id} row={row} />
          ))}
        </div>
      )}

      {sorted.length > TOP_N && (
        <p className="text-xs text-neutral-400">상위 {TOP_N}곳만 표시하고 있어요.</p>
      )}
    </div>
  );
}

function FirstPlaceCard({ row }: { row: RankingRow }) {
  return (
    <Link
      href={`/restaurants/${row.restaurant_id}`}
      className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-card p-5 transition-colors duration-150 dark:border-neutral-800"
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-positive/15 text-5xl">
        {getFoodEmoji(null, row.restaurant_name)}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-positive">🏆 1위</span>
        <span className="text-lg font-bold transition-colors duration-150 group-hover:text-accent">
          {row.restaurant_name}
        </span>
        <span className="text-sm text-neutral-500">
          {row.total_points}점 · {row.total_votes}표
        </span>
      </div>
    </Link>
  );
}

function RankCard({ row }: { row: RankingRow }) {
  return (
    <Link
      href={`/restaurants/${row.restaurant_id}`}
      className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-200 p-3 text-center transition-colors duration-150 dark:border-neutral-800"
    >
      <span className="text-xs font-semibold text-neutral-500">{row.rnk}위</span>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-2xl dark:bg-neutral-800">
        {getFoodEmoji(null, row.restaurant_name)}
      </div>
      <span className="line-clamp-1 text-sm font-medium transition-colors duration-150 group-hover:text-accent">
        {row.restaurant_name}
      </span>
      <span className="text-xs text-neutral-500">
        {row.total_points}점 · {row.total_votes}표
      </span>
    </Link>
  );
}
