import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name")
    .order("id");

  return (
    <main>
      <h1>맛집 도장깨기</h1>
      <ul>
        {restaurants?.map((restaurant) => (
          <li key={restaurant.id}>{restaurant.name}</li>
        ))}
      </ul>
    </main>
  );
}
