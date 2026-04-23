import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    return NextResponse.json({ message: "データベースのセットアップが完了しました" });
  } catch (error) {
    return NextResponse.json(
      { error: "セットアップに失敗しました", details: String(error) },
      { status: 500 }
    );
  }
}
