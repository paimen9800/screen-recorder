"use client";

import { useState } from "react";
import Link from "next/link";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { ShareDialog } from "@/components/video/ShareDialog";
import { Button } from "@/components/ui/button";
import { formatDuration, formatRelativeTime } from "@/lib/format";
import { APP_NAME } from "@/lib/constants";
import { Download, Share2, Eye, Monitor } from "lucide-react";

interface WatchPageClientProps {
  recording: {
    id: string;
    title: string;
    duration_seconds: number | null;
    view_count: number;
    created_at: string;
    video_url: string;
    thumbnail_url: string | null;
  };
  videoUrl: string;
  thumbnailUrl: string | null;
}

export function WatchPageClient({
  recording,
  videoUrl,
  thumbnailUrl,
}: WatchPageClientProps) {
  const [shareOpen, setShareOpen] = useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${recording.title}.webm`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <Monitor className="h-5 w-5" />
            <span className="font-semibold">{APP_NAME}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <VideoPlayer src={videoUrl} poster={thumbnailUrl || undefined} />

        <div className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-white">
                {recording.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{formatRelativeTime(recording.created_at)}</span>
                {recording.duration_seconds && (
                  <>
                    <span>|</span>
                    <span>{formatDuration(recording.duration_seconds)}</span>
                  </>
                )}
                <span>|</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {recording.view_count} 回視聴
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShareOpen(true)}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Share2 className="mr-2 h-4 w-4" />
                共有
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Download className="mr-2 h-4 w-4" />
                ダウンロード
              </Button>
            </div>
          </div>
        </div>
      </main>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        videoId={recording.id}
        videoUrl={videoUrl}
        title={recording.title}
      />
    </div>
  );
}
