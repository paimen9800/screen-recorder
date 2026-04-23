"use client";

import { useState, useCallback } from "react";

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

  const upload = useCallback(
    async (blob: Blob, options: UploadOptions): Promise<string | null> => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // 1. 動画をアップロード
        setProgress(10);
        const videoFormData = new FormData();
        videoFormData.append("file", blob, "recording.webm");
        videoFormData.append("type", "video");

        const videoRes = await fetch("/api/upload", {
          method: "POST",
          body: videoFormData,
        });

        if (!videoRes.ok) throw new Error("動画のアップロードに失敗しました");
        const { url: videoUrl } = await videoRes.json();
        setProgress(70);

        // 2. サムネイルを生成してアップロード
        let thumbnailUrl: string | null = null;
        const thumbnail = await generateThumbnail(blob);
        if (thumbnail) {
          const thumbFormData = new FormData();
          thumbFormData.append("file", thumbnail, "thumbnail.png");
          thumbFormData.append("type", "thumbnail");

          const thumbRes = await fetch("/api/upload", {
            method: "POST",
            body: thumbFormData,
          });

          if (thumbRes.ok) {
            const thumbData = await thumbRes.json();
            thumbnailUrl = thumbData.url;
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

        if (!metaRes.ok) throw new Error("メタデータの保存に失敗しました");
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
    [generateThumbnail]
  );

  return { upload, uploading, progress, error };
}
