import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@vercel/postgres";
import { del } from "@vercel/blob";

// 公開動画の取得（共有リンク用）+ 再生回数インクリメント
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { rows } = await sql`
    SELECT * FROM recordings WHERE id = ${params.id} AND is_public = true
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "動画が見つかりません" }, { status: 404 });
  }

  // 再生回数をインクリメント
  await sql`
    UPDATE recordings SET view_count = view_count + 1 WHERE id = ${params.id}
  `;

  return NextResponse.json({ recording: { ...rows[0], view_count: rows[0].view_count + 1 } });
}

// 録画の削除
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;

  // 自分の録画か確認
  const { rows } = await sql`
    SELECT * FROM recordings WHERE id = ${params.id} AND user_id = ${userId}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "動画が見つかりません" }, { status: 404 });
  }

  const recording = rows[0];

  // Vercel Blob から削除
  try {
    await del(recording.video_url);
    if (recording.thumbnail_url) {
      await del(recording.thumbnail_url);
    }
  } catch {
    // Blob削除失敗しても DB は削除する
  }

  await sql`DELETE FROM recordings WHERE id = ${params.id}`;

  return NextResponse.json({ success: true });
}
