import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDuration } from "@/lib/format";
import { SUPABASE_STORAGE_BUCKET, APP_NAME } from "@/lib/constants";
import { WatchPageClient } from "./client";

interface PageProps {
  params: { id: string };
}

async function getRecording(id: string) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore
          }
        },
      },
    }
  );

  const { data: recording } = await supabase
    .from("recordings")
    .select("*")
    .eq("id", id)
    .single();

  if (!recording) return null;

  // 再生回数をインクリメント
  await supabase.rpc("increment_view_count", { recording_id: id });

  // 動画URLを取得
  const { data: urlData } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(recording.storage_path);

  // サムネイルURLを取得
  let thumbnailUrl: string | null = null;
  if (recording.thumbnail_path) {
    const { data: thumbData } = supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(recording.thumbnail_path);
    thumbnailUrl = thumbData.publicUrl;
  }

  return {
    ...recording,
    videoUrl: urlData.publicUrl,
    thumbnailUrl,
  };
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
      ...(recording.thumbnailUrl && {
        images: [{ url: recording.thumbnailUrl }],
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
      videoUrl={recording.videoUrl}
      thumbnailUrl={recording.thumbnailUrl}
    />
  );
}
