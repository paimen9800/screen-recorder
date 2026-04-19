"use client";

import { useState, useEffect } from "react";
import { RECORDING } from "@/lib/constants";

export function CountdownOverlay() {
  const [count, setCount] = useState<number>(RECORDING.COUNTDOWN_SECONDS);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  if (count <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
        <span className="text-6xl font-bold text-white animate-bounce">
          {count}
        </span>
      </div>
    </div>
  );
}
