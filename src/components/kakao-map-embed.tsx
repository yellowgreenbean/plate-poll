"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type KakaoLatLng = unknown;

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Map: new (
          container: HTMLElement,
          options: { center: KakaoLatLng; level: number }
        ) => unknown;
        Marker: new (options: { position: KakaoLatLng }) => {
          setMap: (map: unknown) => void;
        };
      };
    };
  }
}

export function KakaoMapEmbed({
  lat,
  lng,
  name,
  placeUrl,
}: {
  lat: number;
  lng: number;
  name: string;
  placeUrl?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    if (!sdkLoaded || !containerRef.current) return;

    window.kakao.maps.load(() => {
      if (!containerRef.current) return;

      const center = new window.kakao.maps.LatLng(lat, lng);
      const map = new window.kakao.maps.Map(containerRef.current, {
        center,
        level: 3,
      });

      const marker = new window.kakao.maps.Marker({ position: center });
      marker.setMap(map);
    });
  }, [sdkLoaded, lat, lng]);

  return (
    <div className="flex flex-col gap-2">
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false`}
        strategy="afterInteractive"
        onReady={() => setSdkLoaded(true)}
      />
      <div
        ref={containerRef}
        role="img"
        aria-label={`${name} 위치 지도`}
        className="h-64 w-full rounded-md border border-neutral-200 dark:border-neutral-800"
      />
      {placeUrl && (
        <a
          href={placeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium underline"
        >
          카카오맵에서 별점·리뷰 보기
        </a>
      )}
    </div>
  );
}
