"use client";

import { useEffect, useState } from "react";

export function CountdownBadge({ closesAt }: { closesAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timeoutId = setTimeout(tick, 0);
    const intervalId = setInterval(tick, 30_000);
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  if (now === null) return null;

  const diffMs = new Date(closesAt).getTime() - now;
  if (diffMs <= 0) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const label = hours > 0 ? `${hours}시간 ${minutes}분 남음` : `${minutes}분 남음`;
  const isUrgent = diffMs <= 30 * 60 * 1000;

  return (
    <span
      className={`text-xs font-medium ${isUrgent ? "text-red-600" : "text-secondary"}`}
    >
      {label}
    </span>
  );
}
