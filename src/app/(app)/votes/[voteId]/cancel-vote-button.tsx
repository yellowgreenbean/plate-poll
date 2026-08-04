"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelVoteAction } from "./actions";

export function CancelVoteButton({ voteId }: { voteId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    if (!window.confirm("이 투표를 취소하시겠어요? 취소하면 되돌릴 수 없어요.")) {
      return;
    }
    startTransition(async () => {
      await cancelVoteAction(voteId);
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="ghost" onClick={handleCancel} disabled={isPending}>
      {isPending ? "취소하는 중..." : "투표 취소"}
    </Button>
  );
}
