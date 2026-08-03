"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";

export type KakaoSearchResult = {
  kakaoPlaceId: string;
  name: string;
  category: string | null;
  address: string;
  lat: number;
  lng: number;
  placeUrl: string;
};

export function KakaoSearchBox({
  onSelect,
}: {
  onSelect: (place: KakaoSearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KakaoSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length >= 2;

  useEffect(() => {
    if (!showResults) {
      abortRef.current?.abort();
      return;
    }

    const timeoutId = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      fetch(`/api/kakao/search?q=${encodeURIComponent(trimmedQuery)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            setError(data.error ?? "검색에 실패했습니다.");
            setResults([]);
            return;
          }
          setResults(data.places ?? []);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError("검색 중 오류가 발생했습니다.");
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [showResults, trimmedQuery]);

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="text"
        placeholder="식당 이름으로 검색 (예: 김밥천국 강남점)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {showResults && isLoading && (
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Spinner /> 검색 중...
        </div>
      )}

      {showResults && error && <p className="text-sm text-red-600">{error}</p>}

      {showResults && results.length > 0 && (
        <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
          {results.map((place) => (
            <li
              key={place.kakaoPlaceId}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{place.name}</span>
                <span className="text-xs text-neutral-500">
                  {place.category ? `${place.category} · ` : ""}
                  {place.address}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0 px-0 py-0"
                onClick={() => onSelect(place)}
              >
                선택
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
