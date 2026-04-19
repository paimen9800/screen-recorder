"use client";

import { useRef, useCallback, useEffect } from "react";
import { RECORDING } from "@/lib/constants";
import type { WebcamPosition } from "@/types/recording";

interface CompositorOptions {
  webcamEnabled: boolean;
  webcamPosition: WebcamPosition;
  webcamSize?: number;
}

export function useCanvasCompositor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const optionsRef = useRef<CompositorOptions>({
    webcamEnabled: true,
    webcamPosition: { x: 0.05, y: 0.75 },
    webcamSize: RECORDING.WEBCAM_SIZE_PX,
  });

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const screenVideo = screenVideoRef.current;
    if (!canvas || !screenVideo) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 画面映像をCanvas全体に描画
    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

    // ウェブカメラのPiP描画
    const webcamVideo = webcamVideoRef.current;
    const opts = optionsRef.current;
    if (opts.webcamEnabled && webcamVideo && webcamVideo.readyState >= 2) {
      const size = opts.webcamSize || RECORDING.WEBCAM_SIZE_PX;
      const x = opts.webcamPosition.x * canvas.width;
      const y = opts.webcamPosition.y * canvas.height;

      // 円形クリッピング
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // ウェブカメラ映像を描画（アスペクト比を維持してフィット）
      const vw = webcamVideo.videoWidth;
      const vh = webcamVideo.videoHeight;
      const scale = Math.max(size / vw, size / vh);
      const sw = vw * scale;
      const sh = vh * scale;
      const sx = x + (size - sw) / 2;
      const sy = y + (size - sh) / 2;
      ctx.drawImage(webcamVideo, sx, sy, sw, sh);
      ctx.restore();

      // 白いボーダー
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    animationFrameRef.current = requestAnimationFrame(drawFrame);
  }, []);

  const startCompositing = useCallback(
    (
      screenStream: MediaStream,
      webcamStream: MediaStream | null,
      options: CompositorOptions
    ): MediaStream | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      // Canvas解像度をスクリーンキャプチャに合わせる
      const screenTrack = screenStream.getVideoTracks()[0];
      const settings = screenTrack.getSettings();
      canvas.width = settings.width || 1920;
      canvas.height = settings.height || 1080;

      // hidden video要素を作成してストリームを再生
      const screenVideo = document.createElement("video");
      screenVideo.srcObject = screenStream;
      screenVideo.muted = true;
      screenVideo.play();
      screenVideoRef.current = screenVideo;

      if (webcamStream) {
        const webcamVideo = document.createElement("video");
        webcamVideo.srcObject = webcamStream;
        webcamVideo.muted = true;
        webcamVideo.play();
        webcamVideoRef.current = webcamVideo;
      }

      optionsRef.current = options;

      // 合成ループ開始
      drawFrame();

      // CanvasからMediaStreamを取得
      return canvas.captureStream(RECORDING.CANVAS_FPS);
    },
    [drawFrame]
  );

  const stopCompositing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
      screenVideoRef.current = null;
    }
    if (webcamVideoRef.current) {
      webcamVideoRef.current.srcObject = null;
      webcamVideoRef.current = null;
    }
  }, []);

  const updateOptions = useCallback((opts: Partial<CompositorOptions>) => {
    optionsRef.current = { ...optionsRef.current, ...opts };
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    canvasRef,
    startCompositing,
    stopCompositing,
    updateOptions,
  };
}
