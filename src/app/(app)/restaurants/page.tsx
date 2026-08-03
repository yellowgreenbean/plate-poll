import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AddRestaurantForm } from "./add-restaurant-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();

  const { data: allRestaurants } = await supabase
    .from("restaurants")
    .select("id, name, address, category, kakao_place_id, profiles(name)")
    .order("created_at", { ascending: false });

  const restaurants = (allRestaurants ?? []).filter((restaurant) => {
    const matchesQuery =
      !q || restaurant.name.toLowerCase().includes(q.toLowerCase());
    const matchesCategory = !category || restaurant.category === category;
    return matchesQuery && matchesCategory;
  });

  const categories = Array.from(
    new Set((allRestaurants ?? []).map((r) => r.category).filter(Boolean))
  ) as string[];

  const existingPlaceIds = (allRestaurants ?? [])
    .map((r) => r.kakao_place_id)
    .filter((id): id is string => Boolean(id));

  const hasFilter = Boolean(q || category);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">식당</h1>
        <p className="text-sm text-neutral-500">
          카카오맵에서 검색해서 점심 후보 식당을 추가하세요.
        </p>
      </div>

      <AddRestaurantForm existingPlaceIds={existingPlaceIds} />

      <form action="/restaurants" method="get" className="flex flex-wrap gap-2">
        <Input
          type="text"
          name="q"
          placeholder="식당 이름 검색"
          defaultValue={q ?? ""}
          className="max-w-xs"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button type="submit" variant="ghost">
          필터 적용
        </Button>
      </form>

      {restaurants.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {hasFilter
            ? "조건에 맞는 식당이 없어요."
            : "아직 등록된 식당이 없어요. 위에서 검색해서 추가해보세요."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id} className="py-3">
              <Link
                href={`/restaurants/${restaurant.id}`}
                className="flex flex-col gap-1"
              >
                <span className="font-medium">{restaurant.name}</span>
                <span className="text-xs text-neutral-500">
                  {restaurant.category ? `${restaurant.category} · ` : ""}
                  {restaurant.address}
                </span>
                {restaurant.profiles?.name && (
                  <span className="text-xs text-neutral-400">
                    {restaurant.profiles.name}님이 등록
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
