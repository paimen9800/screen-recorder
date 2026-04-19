"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDuration, formatRelativeTime } from "@/lib/format";
import { createClient } from "@/lib/supabase-client";
import { SUPABASE_STORAGE_BUCKET } from "@/lib/constants";
import { ShareDialog } from "./ShareDialog";
import { Button } from "@/components/ui/button";
import {
  Play,
  Share2,
  Download,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";
import type { Recording } from "@/types/database";

interface VideoCardProps {
  recording: Recording;
  onDelete: (id: string) => void;
}

export function VideoCard({ recording, onDelete }: VideoCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  const { data: videoUrlData } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(recording.storage_path);

  const thumbnailUrl = recording.thumbnail_path
    ? supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .getPublicUrl(recording.thumbnail_path).data.publicUrl
    : null;

  const handleDelete = async () => {
    if (!confirm("この録画を削除しますか？")) return;
    setDeleting(true);

    // Storage から削除
    await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([recording.storage_path]);
    if (recording.thumbnail_path) {
      await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .remove([recording.thumbnail_path]);
    }

    // DB から削除
    await supabase.from("recordings").delete().eq("id", recording.id);
    onDelete(recording.id);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = videoUrlData.publicUrl;
    a.download = `${recording.title}.webm`;
    a.click();
  };

  return (
    <>
      <div className="group relative rounded-xl border border-gray-800 bg-gray-900 overflow-hidden transition-all hover:border-gray-700 hover:shadow-lg">
        {/* サムネイル */}
        <Link href={`/watch/${recording.id}`}>
          <div className="relative aspect-video bg-gray-800">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={recording.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Play className="h-10 w-10 text-gray-600" />
              </div>
            )}

            {/* 再生時間バッジ */}
            {recording.duration_seconds && (
              <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white font-mono">
                {formatDuration(recording.duration_seconds)}
              </div>
            )}

            {/* ホバーオーバーレイ */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
              <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
            </div>
          </div>
        </Link>

        {/* 情報 */}
        <div className="p-3 space-y-1.5">
          <Link href={`/watch/${recording.id}`}>
            <h3 className="text-sm font-medium text-white truncate hover:text-blue-400 transition-colors">
              {recording.title}
            </h3>
          </Link>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{formatRelativeTime(recording.created_at)}</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {recording.view_count}
            </span>
          </div>
        </div>

        {/* アクションメニュー */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
                  <button
                    onClick={() => {
                      setShareOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <Share2 className="h-4 w-4" />
                    共有
                  </button>
                  <button
                    onClick={() => {
                      handleDownload();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    ダウンロード
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setMenuOpen(false);
                    }}
                    disabled={deleting}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "削除中..." : "削除"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        videoId={recording.id}
        videoUrl={videoUrlData.publicUrl}
        title={recording.title}
      />
    </>
  );
}
