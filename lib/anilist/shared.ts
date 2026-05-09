export type MediaTitle = {
  romaji: string | null;
  english: string | null;
  native: string | null;
};

export type MediaCoverImage = {
  extraLarge: string | null;
  large: string | null;
  color: string | null;
};

export type MediaCharacter = {
  id: number;
  name: {
    full: string | null;
    native: string | null;
  };
  image: {
    large: string | null;
  };
};

export type MediaStreamingEpisode = {
  title: string | null;
  thumbnail: string | null;
  url: string | null;
};

export type Media = {
  id: number;
  title: MediaTitle;
  description: string | null;
  bannerImage: string | null;
  coverImage: MediaCoverImage;
  episodes: number | null;
  duration: number | null;
  status: string | null;
  genres: string[];
  averageScore: number | null;
  seasonYear: number | null;
  streamingEpisodes?: MediaStreamingEpisode[];
  characters?: {
    nodes: MediaCharacter[];
  };
};

export function displayTitle(media: Pick<Media, "title">): string {
  return media.title.english ?? media.title.romaji ?? media.title.native ?? "Untitled anime";
}

export function stripHtml(input: string | null): string {
  if (!input) {
    return "";
  }

  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
