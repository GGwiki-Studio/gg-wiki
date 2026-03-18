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