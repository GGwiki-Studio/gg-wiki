interface Game{
  slug: string;
  name: string;
  cover_image_url: string;
  member_count: number;
}

interface Strat{
  id: string;
  title: string;
  thumbnailUrl: string;
  view_count: number;
  created_at: string;
  author: string;
  gameName: string;
  mapName: string;
}
type UserRole = 'user' | 'moderator' | 'admin';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

interface Report {
  id: string;
  reporter_id: string;
  content_type: 'strategy' | 'comment' | 'strat' | 'user';
  content_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  review_note: string | null;
  action_taken: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter?: { username: string; };
}
