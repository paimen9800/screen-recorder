import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@vercel/postgres";

// 自分の録画一覧
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;

  const { rows } = await sql`
    SELECT * FROM recordings
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ recordings: rows });
}

// 新しい録画のメタデータ登録
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  const body = await request.json();

  const { rows } = await sql`
    INSERT INTO recordings (user_id, title, duration_seconds, file_size_bytes, video_url, thumbnail_url)
    VALUES (${userId}, ${body.title}, ${body.duration_seconds}, ${body.file_size_bytes}, ${body.video_url}, ${body.thumbnail_url || null})
    RETURNING *
  `;

  return NextResponse.json({ recording: rows[0] });
}
