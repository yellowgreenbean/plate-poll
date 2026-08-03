"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold">문제가 발생했습니다</h1>
      <p className="text-sm text-neutral-500">
        {error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      <Button type="button" onClick={() => reset()}>
        다시 시도
      </Button>
    </div>
  );
}
