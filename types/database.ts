export interface Recording {
  id: string;
  user_id: string;
  title: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  video_url: string;
  thumbnail_url: string | null;
  is_public: boolean;
  view_count: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}
