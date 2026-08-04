"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { KakaoSearchResult } from "@/components/kakao-search-box";
import { addRestaurantAction } from "./actions";

export function useAddRestaurant() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function addPlace(place: KakaoSearchResult) {
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

  return { addPlace, isPending, message };
}
