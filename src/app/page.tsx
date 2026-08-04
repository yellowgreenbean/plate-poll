import Image from "next/image";
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
    <main className="flex min-h-screen flex-col items-center px-4 pb-10 text-center">
      <div className="relative mt-6 aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl">
        <Image
          src="/images/basket.jpeg"
          alt="장바구니에 담긴 신선한 재료들"
          fill
          priority
          sizes="(min-width: 448px) 448px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-16 flex flex-1 flex-col items-center justify-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">🍽️ 민주주의 정식</h1>
          <p className="max-w-md text-neutral-500">
            점심 메뉴 정하기, 이제 투표로 1분 만에.
            <br />
            부서·회사별 맛집 랭킹까지 한눈에 확인하세요.
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
      </div>
    </main>
  );
}
