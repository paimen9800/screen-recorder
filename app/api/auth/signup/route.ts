import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "メールアドレスとパスワード（6文字以上）が必要です" },
        { status: 400 }
      );
    }

    const sql = getDb();

    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING id, email
    `;

    return NextResponse.json({ user: rows[0] });
  } catch {
    return NextResponse.json(
      { error: "登録に失敗しました" },
      { status: 500 }
    );
  }
}
