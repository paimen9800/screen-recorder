import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { formatDuration } from "@/lib/format";
import { APP_NAME } from "@/lib/constants";
import { WatchPageClient } from "./client";
import type { Recording } from "@/types/database";

interface PageProps {
  params: { id: string };
}

async function getRecording(id: string) {
  const sql = getDb();

  const rows = await sql`
    SELECT * FROM recordings WHERE id = ${id} AND is_public = true
  `;

  if (rows.length === 0) return null;

  await sql`
    UPDATE recordings SET view_count = view_count + 1 WHERE id = ${id}
  `;

  const r = rows[0] as unknown as Recording;
  return { ...r, view_count: r.view_count + 1 };
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
