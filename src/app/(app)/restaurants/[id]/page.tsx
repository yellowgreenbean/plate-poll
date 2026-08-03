import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KakaoMapEmbed } from "@/components/kakao-map-embed";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, address, category, lat, lng, place_url, profiles(name)")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">{restaurant.name}</h1>
        <p className="text-sm text-neutral-500">
          {restaurant.category ? `${restaurant.category} · ` : ""}
          {restaurant.address}
        </p>
        {restaurant.profiles?.name && (
          <p className="text-xs text-neutral-400">
            {restaurant.profiles.name}님이 등록
          </p>
        )}
      </div>

      {restaurant.lat != null && restaurant.lng != null ? (
        <KakaoMapEmbed
          lat={restaurant.lat}
          lng={restaurant.lng}
          name={restaurant.name}
          placeUrl={restaurant.place_url ?? undefined}
        />
      ) : (
        <p className="text-sm text-neutral-500">위치 정보가 없어요.</p>
      )}
    </div>
  );
}
