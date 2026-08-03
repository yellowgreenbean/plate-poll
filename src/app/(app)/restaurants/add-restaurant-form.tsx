"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KakaoSearchBox, type KakaoSearchResult } from "@/components/kakao-search-box";
import { addRestaurantAction } from "./actions";

export function AddRestaurantForm({
  existingPlaceIds,
}: {
  existingPlaceIds: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function handleSelect(place: KakaoSearchResult) {
    setMessage(null);
    startTransition(async () => {
      const result = await addRestaurantAction({
        kakaoPlaceId: place.kakaoPlaceId,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        placeUrl: place.placeUrl,
        category: place.category,
      });

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setMessage(`"${place.name}" 추가했어요.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <KakaoSearchBox onSelect={handleSelect} existingPlaceIds={existingPlaceIds} />
      {isPending && <p className="text-sm text-neutral-500">추가하는 중...</p>}
      {message && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      )}
    </div>
  );
}
