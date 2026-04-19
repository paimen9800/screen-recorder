"use client";

import { formatDuration } from "@/lib/format";

interface RecordingTimerProps {
  duration: number;
  isRecording: boolean;
}

export function RecordingTimer({ duration, isRecording }: RecordingTimerProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-white">
      {isRecording && (
        <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
      )}
      <span className="font-mono text-sm font-medium">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
