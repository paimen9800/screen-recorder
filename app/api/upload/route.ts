import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string || "video";

  if (!file) {
    return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
  }

  const ext = type === "thumbnail" ? "png" : "webm";
  const folder = type === "thumbnail" ? "thumbnails" : "videos";
  const filename = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
