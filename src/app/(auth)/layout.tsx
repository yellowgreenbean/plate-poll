export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">오늘뭐먹지</h1>
        <p className="text-sm text-neutral-500">사내 점심 투표 서비스</p>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 p-6 shadow-sm dark:border-neutral-800">
        {children}
      </div>
    </div>
  );
}
