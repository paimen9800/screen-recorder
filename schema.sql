-- ============================================
-- Loom風 画面録画アプリ: Supabase スキーマ
-- ============================================

create extension if not exists "uuid-ossp";

-- 動画録画テーブル
create table recordings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '無題の録画',
  duration_seconds integer,
  file_size_bytes bigint,
  storage_path text not null,
  thumbnail_path text,
  is_public boolean default true,
  view_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- インデックス
create index idx_recordings_user_id on recordings(user_id);
create index idx_recordings_created_at on recordings(created_at desc);

-- Row Level Security
alter table recordings enable row level security;

-- 自分の録画のCRUD
create policy "Users can view own recordings"
  on recordings for select using (auth.uid() = user_id);
create policy "Users can insert own recordings"
  on recordings for insert with check (auth.uid() = user_id);
create policy "Users can update own recordings"
  on recordings for update using (auth.uid() = user_id);
create policy "Users can delete own recordings"
  on recordings for delete using (auth.uid() = user_id);

-- 公開録画は誰でも閲覧可
create policy "Anyone can view public recordings"
  on recordings for select using (is_public = true);

-- 再生回数をインクリメントする関数
create or replace function increment_view_count(recording_id uuid)
returns void as $$
begin
  update recordings
  set view_count = view_count + 1
  where id = recording_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- Storage バケット設定
-- Supabase Dashboard > Storage で「recordings」バケットを作成
-- Public bucket: ON
-- File size limit: 500MB
-- Allowed MIME types: video/webm, video/mp4, image/png
-- ============================================

-- Storage ポリシー
-- 認証ユーザーは自分のフォルダにアップロード可能
create policy "Users can upload own recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 認証ユーザーは自分の録画を削除可能
create policy "Users can delete own recordings"
  on storage.objects for delete
  using (
    bucket_id = 'recordings' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 誰でも録画を閲覧可能（共有リンク用）
create policy "Anyone can view recordings"
  on storage.objects for select
  using (bucket_id = 'recordings');
