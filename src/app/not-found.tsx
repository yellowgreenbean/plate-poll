import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-neutral-500">주소가 잘못되었거나 삭제된 페이지입니다.</p>
      <Link href="/" className="text-sm font-medium underline">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
