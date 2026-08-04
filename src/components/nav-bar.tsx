"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/votes", label: "투표" },
  { href: "/restaurants", label: "식당" },
  { href: "/rankings", label: "랭킹" },
];

export function NavBar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/votes" className="font-bold">
          🍽️ 민주주의 정식
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors duration-150 ${
                pathname?.startsWith(link.href)
                  ? "font-medium text-accent"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <span className="text-sm text-neutral-400">{email}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="px-0 py-0">
              로그아웃
            </Button>
          </form>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="메뉴 열기"
          aria-expanded={open}
          className="flex flex-col gap-1 sm:hidden"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
          <span className="block h-0.5 w-5 bg-current" />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-3 border-t border-neutral-200 px-4 py-3 sm:hidden dark:border-neutral-800">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`text-sm transition-colors duration-150 ${
                pathname?.startsWith(link.href) ? "font-medium text-accent" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
          <span className="text-sm text-neutral-400">{email}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" className="px-0 py-0">
              로그아웃
            </Button>
          </form>
        </nav>
      )}
    </header>
  );
}
