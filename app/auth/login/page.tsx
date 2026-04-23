"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { Monitor, Loader2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-6 px-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Monitor className="h-8 w-8" />
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        </div>
        <p className="text-muted-foreground">アカウントにログイン</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="パスワード"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        アカウントがない場合は{" "}
        <Link
          href="/auth/signup"
          className="text-primary underline hover:no-underline"
        >
          新規登録
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense
        fallback={
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
