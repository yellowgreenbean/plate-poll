"use client";

import { KakaoSearchBox } from "@/components/kakao-search-box";
import { useAddRestaurant } from "./use-add-restaurant";

export function AddRestaurantForm({
  existingPlaceIds,
}: {
  existingPlaceIds: string[];
}) {
  const { addPlace, isPending, message } = useAddRestaurant();

  return (
    <div className="flex flex-col gap-2">
      <KakaoSearchBox onSelect={addPlace} existingPlaceIds={existingPlaceIds} />
      {isPending && <p className="text-sm text-neutral-500">추가하는 중...</p>}
      {message && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      )}
    </div>
  );
}
