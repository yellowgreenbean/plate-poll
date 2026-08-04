import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/votes");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">🍚 오늘뭐먹지</h1>
        <p className="max-w-md text-neutral-500">
          점심 메뉴 정하기, 이제 투표로 1분 만에. 부서·회사별 맛집 랭킹까지 한눈에
          확인하세요.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup">
          <Button>회원가입</Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost">로그인</Button>
        </Link>
      </div>
    </main>
  );
}
