"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { SUPABASE_STORAGE_BUCKET } from "@/lib/constants";

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
        video.currentTime = 1; // 1秒目のフレーム

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
        const supabase = createClient();

        // ユーザー情報を取得
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("ログインが必要です");
        }

        const videoId = crypto.randomUUID();
        const storagePath = `${user.id}/${videoId}.webm`;

        // 動画をアップロード
        setProgress(10);
        const { error: uploadError } = await supabase.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .upload(storagePath, blob, {
            contentType: "video/webm",
            upsert: false,
          });

        if (uploadError) throw uploadError;
        setProgress(70);

        // サムネイルを生成してアップロード
        let thumbnailPath: string | null = null;
        const thumbnail = await generateThumbnail(blob);
        if (thumbnail) {
          const thumbPath = `${user.id}/${videoId}-thumb.png`;
          const { error: thumbError } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(thumbPath, thumbnail, {
              contentType: "image/png",
              upsert: false,
            });
          if (!thumbError) {
            thumbnailPath = thumbPath;
          }
        }
        setProgress(85);

        // DB にメタデータを登録
        const { error: dbError } = await supabase.from("recordings").insert({
          id: videoId,
          user_id: user.id,
          title: options.title,
          duration_seconds: options.durationSeconds,
          file_size_bytes: blob.size,
          storage_path: storagePath,
          thumbnail_path: thumbnailPath,
          is_public: true,
        });

        if (dbError) throw dbError;
        setProgress(100);

        return videoId;
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
