"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { submitVoteResponseAction } from "./actions";

export type VoteOptionItem = {
  id: string;
  restaurantId: number;
  name: string;
  category: string | null;
};

const RANK_LABELS = ["1지망", "2지망", "3지망"];

export function VoteParticipateForm({
  voteId,
  options,
  initialOptionIds,
}: {
  voteId: string;
  options: VoteOptionItem[];
  initialOptionIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialOptionIds);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(optionId: string) {
    setMessage(null);
    setError(null);
    setSelected((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, optionId];
    });
  }

  function handleSubmit() {
    setError(null);
    if (selected.length === 0) {
      setError("최소 1곳은 선택해주세요.");
      return;
    }
    startTransition(async () => {
      const result = await submitVoteResponseAction(voteId, selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("투표를 제출했어요.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {options.map((option) => {
          const rankIndex = selected.indexOf(option.id);
          const isSelected = rankIndex !== -1;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => toggle(option.id)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                  isSelected
                    ? "border-neutral-900 dark:border-neutral-100"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <span>
                  {option.name}
                  {option.category && (
                    <span className="text-neutral-500"> · {option.category}</span>
                  )}
                </span>
                {isSelected && (
                  <span className="text-xs font-medium">{RANK_LABELS[rankIndex]}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-neutral-500">
        원하는 순서대로 최대 3곳을 눌러 1·2·3지망을 정하세요. 다시 누르면 선택이 취소돼요.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      )}

      <Button type="button" onClick={handleSubmit} disabled={isPending}>
        {isPending
          ? "제출 중..."
          : initialOptionIds.length > 0
            ? "다시 제출하기"
            : "투표하기"}
      </Button>
    </div>
  );
}
