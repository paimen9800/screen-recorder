"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { VideoLibrary } from "@/components/video/VideoLibrary";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { Monitor, Plus, LogOut, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-950">
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
                {session.user?.email}
              </span>
              <Button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
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
