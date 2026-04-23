"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { Monitor } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "登録に失敗しました");
      setLoading(false);
      return;
    }

    // 登録成功 → 自動ログイン
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("登録は成功しましたが、ログインに失敗しました");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Monitor className="h-8 w-8" />
            <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          </div>
          <p className="text-muted-foreground">新規アカウント作成</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              required
              minLength={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登録中..." : "アカウント作成"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          既にアカウントがある場合は{" "}
          <Link
            href="/auth/login"
            className="text-primary underline hover:no-underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
