import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateVoteForm } from "./create-vote-form";

export default async function NewVotePage() {
  const supabase = await createClient();

  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, name, category")
    .order("name");

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-neutral-500">
          🍽️ 아직 등록된 식당이 없어요. 먼저 식당을 등록해주세요.
        </p>
        <Link
          href="/restaurants"
          className="text-sm font-medium text-accent underline transition-colors duration-150 hover:text-accent-hover"
        >
          식당 등록하러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">투표 만들기</h1>
        <p className="text-sm text-neutral-500">
          후보 식당을 고르고 마감 시각을 정하세요.
        </p>
      </div>
      <CreateVoteForm restaurants={restaurants} />
    </div>
  );
}
