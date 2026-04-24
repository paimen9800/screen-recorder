"use client";

import { useState, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export function useFFmpeg() {
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress: p }) => {
      setProgress(Math.round(p * 100));
    });

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  }, []);

  const convertToMp4 = useCallback(
    async (webmBlob: Blob): Promise<Blob | null> => {
      setConverting(true);
      setProgress(0);

      try {
        const ffmpeg = await loadFFmpeg();

        await ffmpeg.writeFile("input.webm", await fetchFile(webmBlob));

        await ffmpeg.exec([
          "-i", "input.webm",
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          "output.mp4",
        ]);

        const data = await ffmpeg.readFile("output.mp4");
        const mp4Blob = new Blob([data], { type: "video/mp4" });

        // クリーンアップ
        await ffmpeg.deleteFile("input.webm");
        await ffmpeg.deleteFile("output.mp4");

        return mp4Blob;
      } catch (err) {
        console.error("MP4変換エラー:", err);
        return null;
      } finally {
        setConverting(false);
        setProgress(0);
      }
    },
    [loadFFmpeg]
  );

  return { convertToMp4, converting, progress };
}
