"use client";

import { useRef, useState } from "react";
import type { LunchSuggestion } from "@/lib/gemini";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { KakaoSearchBox } from "@/components/kakao-search-box";
import { useAddRestaurant } from "./use-add-restaurant";

const COOLDOWN_MS = 4000;

export function LunchRecommender({ existingPlaceIds }: { existingPlaceIds: string[] }) {
  const [moodText, setMoodText] = useState("");
  const [suggestions, setSuggestions] = useState<LunchSuggestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { addPlace, isPending, message } = useAddRestaurant();

  const trimmedMood = moodText.trim();
  const canSubmit = trimmedMood.length >= 2 && trimmedMood.length <= 200;

  function handleRecommend() {
    if (!canSubmit || isLoading || cooldownActive) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setActiveIndex(null);

    fetch("/api/gemini/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moodText: trimmedMood }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "추천을 가져오지 못했습니다.");
          setSuggestions(null);
          return;
        }
        setSuggestions(data.suggestions ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("추천 요청 중 오류가 발생했습니다.");
        setSuggestions(null);
      })
      .finally(() => {
        setIsLoading(false);
        setCooldownActive(true);
        setTimeout(() => setCooldownActive(false), COOLDOWN_MS);
      });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-card p-4 dark:border-neutral-800">
      <div>
        <h2 className="text-sm font-semibold text-secondary">🤖 점심 추천 봇</h2>
        <p className="text-xs text-neutral-500">
          오늘 기분이나 상황을 한 줄로 적어주세요. AI가 메뉴를 추천해드려요.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          aria-label="기분이나 상황 입력"
          placeholder="예: 매운거 땡겨, 비오는날 국물"
          value={moodText}
          onChange={(event) => setMoodText(event.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleRecommend}
          disabled={!canSubmit || isLoading || cooldownActive}
        >
          추천받기
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spinner /> 추천을 생각하는 중...
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {suggestions !== null && suggestions.length === 0 && !isLoading && !error && (
        <p className="animate-fade-in text-sm text-neutral-500">
          🤔 추천할 만한 걸 찾지 못했어요. 다르게 표현해서 다시 시도해보세요.
        </p>
      )}

      {suggestions !== null && suggestions.length > 0 && (
        <ul className="animate-fade-in flex flex-col gap-3">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.name}-${index}`}
              className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{suggestion.name}</span>
                  <span className="text-xs text-neutral-500">
                    {suggestion.category ?? "카테고리 미확인"}
                  </span>
                  <span className="mt-1 text-xs text-neutral-500">{suggestion.reason}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                >
                  {activeIndex === index ? "닫기" : "카카오맵에서 찾아서 등록"}
                </Button>
              </div>

              {activeIndex === index && (
                <KakaoSearchBox
                  key={`${index}-${suggestion.name}`}
                  initialQuery={suggestion.name}
                  onSelect={addPlace}
                  existingPlaceIds={existingPlaceIds}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {isPending && <p className="text-sm text-neutral-500">추가하는 중...</p>}
      {message && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
      )}
    </div>
  );
}
