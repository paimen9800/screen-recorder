"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useCanvasCompositor } from "./useCanvasCompositor";
import { RECORDING, CODEC_CANDIDATES } from "@/lib/constants";
import type { RecordingStatus, WebcamPosition } from "@/types/recording";

function getPreferredMimeType(): string {
  for (const mime of CODEC_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

export function useScreenRecorder() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webcamPosition, setWebcamPosition] = useState<WebcamPosition>({
    x: 0.05,
    y: 0.75,
  });

  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { canvasRef, startCompositing, stopCompositing, updateOptions } =
    useCanvasCompositor();

  // ウェブカメラのON/OFF
  const webcamStreamForPreview = webcamStreamRef.current;

  const cleanup = useCallback(() => {
    // タイマー停止
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }

    // MediaRecorder停止
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    // Canvas合成停止
    stopCompositing();

    // AudioContext停止
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // ストリーム停止
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    webcamStreamRef.current = null;
  }, [stopCompositing]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordedBlob(null);
      chunksRef.current = [];
      setDuration(0);

      // 1. 画面共有を要求
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });
      screenStreamRef.current = screenStream;

      // 画面共有が外部で終了されたときのハンドリング
      screenStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopRecording();
      });

      // 2. ウェブカメラ＋マイクを要求
      let webcamStream: MediaStream | null = null;
      if (webcamEnabled) {
        try {
          webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user",
            },
            audio: true,
          });
          webcamStreamRef.current = webcamStream;
        } catch {
          // ウェブカメラが使えなくても録画は続行
          console.warn("ウェブカメラの取得に失敗。画面のみで録画を続行");
          setWebcamEnabled(false);
        }
      } else {
        // カメラOFF時もマイクだけ取得
        try {
          webcamStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          webcamStreamRef.current = webcamStream;
        } catch {
          console.warn("マイクの取得に失敗");
        }
      }

      // 3. カウントダウン
      setStatus("countdown");
      await new Promise<void>((resolve) => {
        countdownRef.current = setTimeout(resolve, RECORDING.COUNTDOWN_SECONDS * 1000);
      });

      // 4. Canvas合成を開始
      const canvasStream = startCompositing(screenStream, webcamStream, {
        webcamEnabled,
        webcamPosition,
        webcamSize: RECORDING.WEBCAM_SIZE_PX,
      });

      if (!canvasStream) {
        throw new Error("Canvas合成の開始に失敗しました");
      }

      // 5. オーディオミキシング
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      // システム音声（画面共有から）
      const screenAudioTracks = screenStream.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        const systemSource = audioContext.createMediaStreamSource(
          new MediaStream(screenAudioTracks)
        );
        systemSource.connect(destination);
      }

      // マイク音声
      if (micEnabled && webcamStream) {
        const micTracks = webcamStream.getAudioTracks();
        if (micTracks.length > 0) {
          const micSource = audioContext.createMediaStreamSource(
            new MediaStream(micTracks)
          );
          micSource.connect(destination);
        }
      }

      // 6. 最終ストリーム（映像 + 音声）
      const finalStream = new MediaStream([
        canvasStream.getVideoTracks()[0],
        ...destination.stream.getAudioTracks(),
      ]);

      // 7. MediaRecorder開始
      const mimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(finalStream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: RECORDING.VIDEO_BITRATE,
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "video/webm",
        });
        setRecordedBlob(blob);
        setStatus("processing");
        cleanup();
      };

      recorder.start(RECORDING.CHUNK_INTERVAL_MS);
      setStatus("recording");

      // 8. タイマー開始
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= RECORDING.MAX_DURATION_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      cleanup();
      setStatus("idle");
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("画面共有が拒否されました");
        } else {
          setError(err.message);
        }
      } else {
        setError("録画の開始に失敗しました");
      }
    }
  }, [webcamEnabled, micEnabled, webcamPosition, startCompositing, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  const toggleWebcam = useCallback(() => {
    const newValue = !webcamEnabled;
    setWebcamEnabled(newValue);
    updateOptions({ webcamEnabled: newValue });
  }, [webcamEnabled, updateOptions]);

  const toggleMic = useCallback(() => {
    setMicEnabled((prev) => {
      const newValue = !prev;
      // ミュート/アンミュートのマイクトラック
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = newValue;
        });
      }
      return newValue;
    });
  }, []);

  const updateWebcamPosition = useCallback(
    (position: WebcamPosition) => {
      setWebcamPosition(position);
      updateOptions({ webcamPosition: position });
    },
    [updateOptions]
  );

  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
    setDuration(0);
    setStatus("idle");
    chunksRef.current = [];
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    status,
    duration,
    webcamEnabled,
    micEnabled,
    recordedBlob,
    error,
    webcamPosition,
    webcamStream: webcamStreamRef.current,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    toggleWebcam,
    toggleMic,
    updateWebcamPosition,
    discardRecording,

    // Refs
    canvasRef,
  };
}
