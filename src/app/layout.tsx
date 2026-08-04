import type { Metadata } from "next";
import "./globals.css";

const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="80">🍚</text></svg>'
)}`;

export const metadata: Metadata = {
  title: "오늘뭐먹지 | PlatePoll",
  description: "회사 점심 투표와 부서별·회사별 맛집 랭킹을 한눈에",
  icons: { icon: FAVICON },
  openGraph: {
    title: "오늘뭐먹지",
    description: "회사 점심 투표와 부서별·회사별 맛집 랭킹을 한눈에",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
