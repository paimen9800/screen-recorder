"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { VideoLibrary } from "@/components/video/VideoLibrary";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { Monitor, Plus, LogOut, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser({ email: user.email });
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ヘッダー */}
      <header className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <Monitor className="h-5 w-5" />
            <span className="font-semibold text-lg">{APP_NAME}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/record">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                <Plus className="mr-2 h-4 w-4" />
                新しく録画
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 hidden sm:block">
                {user?.email}
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800"
                title="ログアウト"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">マイ録画</h1>
          <p className="text-sm text-gray-400 mt-1">
            録画した動画を管理・共有できます
          </p>
        </div>

        <VideoLibrary />
      </main>
    </div>
  );
}
