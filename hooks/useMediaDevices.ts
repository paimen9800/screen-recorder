"use client";

import { useState, useCallback } from "react";

interface MediaDeviceStreams {
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
}

export function useMediaDevices() {
  const [streams, setStreams] = useState<MediaDeviceStreams>({
    screenStream: null,
    webcamStream: null,
  });
  const [error, setError] = useState<string | null>(null);

  const requestScreenShare = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true,
      });
      setStreams((prev) => ({ ...prev, screenStream: stream }));
      setError(null);
      return stream;
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("画面共有が拒否されました");
      } else {
        setError("画面共有の開始に失敗しました");
      }
      return null;
    }
  }, []);

  const requestWebcam = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: true,
      });
      setStreams((prev) => ({ ...prev, webcamStream: stream }));
      setError(null);
      return stream;
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("カメラ/マイクのアクセスが拒否されました");
      } else {
        setError("カメラ/マイクの開始に失敗しました");
      }
      return null;
    }
  }, []);

  const stopAllStreams = useCallback(() => {
    streams.screenStream?.getTracks().forEach((t) => t.stop());
    streams.webcamStream?.getTracks().forEach((t) => t.stop());
    setStreams({ screenStream: null, webcamStream: null });
  }, [streams]);

  const stopWebcam = useCallback(() => {
    streams.webcamStream?.getTracks().forEach((t) => t.stop());
    setStreams((prev) => ({ ...prev, webcamStream: null }));
  }, [streams.webcamStream]);

  return {
    ...streams,
    error,
    requestScreenShare,
    requestWebcam,
    stopAllStreams,
    stopWebcam,
  };
}
