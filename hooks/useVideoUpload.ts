"use client";

import { useState, useCallback } from "react";
import { upload as blobUpload } from "@vercel/blob/client";

interface UploadOptions {
  title: string;
  durationSeconds: number;
}

export function useVideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateThumbnail = useCallback(
    async (blob: Blob): Promise<Blob | null> => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(blob);
        video.muted = true;
        video.currentTime = 1;

        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(video, 0, 0, 320, 180);
          canvas.toBlob(
            (thumbBlob) => {
              URL.revokeObjectURL(video.src);
              resolve(thumbBlob);
            },
            "image/png"
          );
        };

        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve(null);
        };

        video.load();
      });
    },
    []
  );

  const uploadFile = useCallback(
    async (file: Blob, filename: string): Promise<string> => {
      const result = await blobUpload(filename, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      return result.url;
    },
    []
  );

  const upload = useCallback(
    async (blob: Blob, options: UploadOptions): Promise<string | null> => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // 1. 動画をVercel Blobに直接アップロード
        setProgress(10);
        const videoFilename = `videos/${Date.now()}-${crypto.randomUUID()}.webm`;
        const videoUrl = await uploadFile(blob, videoFilename);
        setProgress(70);

        // 2. サムネイルを生成してアップロード
        let thumbnailUrl: string | null = null;
        const thumbnail = await generateThumbnail(blob);
        if (thumbnail) {
          try {
            const thumbFilename = `thumbnails/${Date.now()}-${crypto.randomUUID()}.png`;
            thumbnailUrl = await uploadFile(thumbnail, thumbFilename);
          } catch {
            // サムネイル失敗は無視
          }
        }
        setProgress(85);

        // 3. DB にメタデータを登録
        const metaRes = await fetch("/api/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: options.title,
            duration_seconds: options.durationSeconds,
            file_size_bytes: blob.size,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
          }),
        });

        if (!metaRes.ok) {
          const data = await metaRes.json();
          throw new Error(data.error || "メタデータの保存に失敗しました");
        }
        const { recording } = await metaRes.json();
        setProgress(100);

        return recording.id;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "アップロードに失敗しました";
        setError(message);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [generateThumbnail, uploadFile]
  );

  return { upload, uploading, progress, error };
}
