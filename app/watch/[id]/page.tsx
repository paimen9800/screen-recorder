import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sql } from "@vercel/postgres";
import { formatDuration } from "@/lib/format";
import { APP_NAME } from "@/lib/constants";
import { WatchPageClient } from "./client";

interface PageProps {
  params: { id: string };
}

async function getRecording(id: string) {
  const { rows } = await sql`
    SELECT * FROM recordings WHERE id = ${id} AND is_public = true
  `;

  if (rows.length === 0) return null;

  // 再生回数をインクリメント
  await sql`
    UPDATE recordings SET view_count = view_count + 1 WHERE id = ${id}
  `;

  return { ...rows[0], view_count: rows[0].view_count + 1 };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const recording = await getRecording(params.id);
  if (!recording) {
    return { title: "動画が見つかりません" };
  }

  return {
    title: `${recording.title} - ${APP_NAME}`,
    description: `${formatDuration(recording.duration_seconds || 0)} の画面録画`,
    openGraph: {
      title: recording.title,
      description: `${formatDuration(recording.duration_seconds || 0)} の画面録画`,
      type: "video.other",
      ...(recording.thumbnail_url && {
        images: [{ url: recording.thumbnail_url }],
      }),
    },
  };
}

export default async function WatchPage({ params }: PageProps) {
  const recording = await getRecording(params.id);

  if (!recording) {
    notFound();
  }

  return (
    <WatchPageClient
      recording={recording}
      videoUrl={recording.video_url}
      thumbnailUrl={recording.thumbnail_url}
    />
  );
}
