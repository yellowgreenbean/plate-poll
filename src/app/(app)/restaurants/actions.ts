"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddRestaurantInput = {
  kakaoPlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeUrl: string;
  category: string | null;
};

export type AddRestaurantState = {
  error: string | null;
};

export async function addRestaurantAction(
  input: AddRestaurantInput
): Promise<AddRestaurantState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("restaurants").upsert(
    {
      kakao_place_id: input.kakaoPlaceId,
      name: input.name,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
      place_url: input.placeUrl,
      category: input.category,
      created_by: user.id,
    },
    { onConflict: "kakao_place_id", ignoreDuplicates: true }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/restaurants");
  return { error: null };
}
