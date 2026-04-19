"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { VideoCard } from "./VideoCard";
import { Video, Loader2 } from "lucide-react";
import type { Recording } from "@/types/database";

export function VideoLibrary() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecordings() {
      const supabase = createClient();
      const { data } = await supabase
        .from("recordings")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setRecordings(data as Recording[]);
      }
      setLoading(false);
    }

    fetchRecordings();
  }, []);

  const handleDelete = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Video className="h-16 w-16 text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">
          まだ録画がありません
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          「新しく録画」ボタンを押して、最初の画面録画を作成しましょう。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {recordings.map((recording) => (
        <VideoCard
          key={recording.id}
          recording={recording}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
