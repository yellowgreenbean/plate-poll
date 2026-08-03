"use client";

import { useActionState, useState } from "react";
import { createVoteAction, type CreateVoteState } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: CreateVoteState = { error: null };

type Restaurant = { id: number; name: string; category: string | null };

function getDefaultClosesAt(): string {
  const now = new Date();
  const preset = new Date(now);
  preset.setHours(11, 30, 0, 0);
  if (preset.getTime() <= now.getTime()) {
    preset.setDate(preset.getDate() + 1);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${preset.getFullYear()}-${pad(preset.getMonth() + 1)}-${pad(
    preset.getDate()
  )}T${pad(preset.getHours())}:${pad(preset.getMinutes())}`;
}

export function CreateVoteForm({ restaurants }: { restaurants: Restaurant[] }) {
  const [state, formAction, isPending] = useActionState(createVoteAction, initialState);
  const [defaultClosesAt] = useState(getDefaultClosesAt);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          투표 제목 (선택)
        </label>
        <Input id="title" name="title" type="text" placeholder="예: 오늘 점심 뭐 먹지?" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="closes_at" className="text-sm font-medium">
          마감 시각
        </label>
        <Input
          id="closes_at"
          name="closes_at"
          type="datetime-local"
          required
          defaultValue={defaultClosesAt}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">후보 식당</legend>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          {restaurants.map((restaurant) => (
            <label key={restaurant.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="restaurant_ids" value={restaurant.id} />
              <span>
                {restaurant.name}
                {restaurant.category && (
                  <span className="text-neutral-500"> · {restaurant.category}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "만드는 중..." : "투표 만들기"}
      </Button>
    </form>
  );
}
