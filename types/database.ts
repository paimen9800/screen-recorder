export interface Recording {
  id: string;
  user_id: string;
  title: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  storage_path: string;
  thumbnail_path: string | null;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
}
