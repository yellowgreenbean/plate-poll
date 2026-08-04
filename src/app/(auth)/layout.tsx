import Image from "next/image";
import { Card } from "@/components/ui/card";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/basket.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover blur-2xl"
        />
        <div className="absolute inset-0 bg-black/60 dark:bg-black/75" />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold text-white">🍽️ 민주주의 정식</h1>
        <p className="text-sm text-neutral-300">사내 점심 투표 서비스</p>
      </div>
      <Card>{children}</Card>
    </div>
  );
}
