import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
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
