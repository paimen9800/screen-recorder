import { sql } from "@vercel/postgres";

export { sql };

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS recordings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
      title TEXT NOT NULL DEFAULT '無題の録画',
      duration_seconds INTEGER,
      file_size_bytes BIGINT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      is_public BOOLEAN DEFAULT TRUE,
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}
