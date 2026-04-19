"use client";

import {
  Circle,
  Square,
  Pause,
  Play,
  Mic,
  MicOff,
  Camera,
  CameraOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordingTimer } from "./RecordingTimer";
import type { RecordingStatus } from "@/types/recording";

interface RecordingControlsProps {
  status: RecordingStatus;
  duration: number;
  webcamEnabled: boolean;
  micEnabled: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onToggleWebcam: () => void;
  onToggleMic: () => void;
}

export function RecordingControls({
  status,
  duration,
  webcamEnabled,
  micEnabled,
  onStart,
  onStop,
  onPause,
  onResume,
  onToggleWebcam,
  onToggleMic,
}: RecordingControlsProps) {
  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isIdle = status === "idle";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-900/90 px-6 py-3 backdrop-blur-md shadow-2xl">
      {/* タイマー */}
      {(isRecording || isPaused) && (
        <RecordingTimer duration={duration} isRecording={isRecording} />
      )}

      {/* メインボタン：開始 or 停止 */}
      {isIdle ? (
        <Button
          onClick={onStart}
          className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
          size="icon"
        >
          <Circle className="h-6 w-6 fill-current" />
        </Button>
      ) : (
        <Button
          onClick={onStop}
          className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
          size="icon"
        >
          <Square className="h-5 w-5 fill-current" />
        </Button>
      )}

      {/* 一時停止/再開 */}
      {(isRecording || isPaused) && (
        <Button
          onClick={isPaused ? onResume : onPause}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-white hover:bg-white/20"
        >
          {isPaused ? (
            <Play className="h-5 w-5" />
          ) : (
            <Pause className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* セパレーター */}
      {!isIdle && <div className="h-8 w-px bg-white/20" />}

      {/* カメラトグル */}
      <Button
        onClick={onToggleWebcam}
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full text-white hover:bg-white/20"
        title={webcamEnabled ? "カメラOFF" : "カメラON"}
      >
        {webcamEnabled ? (
          <Camera className="h-5 w-5" />
        ) : (
          <CameraOff className="h-5 w-5 opacity-50" />
        )}
      </Button>

      {/* マイクトグル */}
      <Button
        onClick={onToggleMic}
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full text-white hover:bg-white/20"
        title={micEnabled ? "マイクOFF" : "マイクON"}
      >
        {micEnabled ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5 opacity-50" />
        )}
      </Button>
    </div>
  );
}
