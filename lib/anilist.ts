const ANILIST_URL = "https://graphql.anilist.co";

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

type AniListError = {
  message: string;
};

type AniListGraphqlResponse<T> = {
  data?: T;
  errors?: AniListError[];
};

async function anilistFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 1800 }
  });

  const payload = (await response.json()) as AniListGraphqlResponse<T>;

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? `AniList request failed with ${response.status}`);
  }

  if (!payload.data) {
    throw new Error("AniList response did not include data");
  }

  return payload.data;
}

const mediaFields = `
  id
  title {
    romaji
    english
    native
  }
  description(asHtml: false)
  bannerImage
  coverImage {
    extraLarge
    large
    color
  }
  episodes
  duration
  status
  genres
  averageScore
  seasonYear
  streamingEpisodes {
    title
    thumbnail
    url
  }
`;

export async function getTrendingAnime(page = 1, perPage = 18): Promise<Media[]> {
  const query = `
    query TrendingAnime($page: Int!, $perPage: Int!) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${mediaFields}
        }
      }
    }
  `;

  const result = await anilistFetch<{ Page: { media: Media[] } }>(query, { page, perPage });
  return result.Page.media;
}

export async function getPopularAnime(page = 1, perPage = 24): Promise<Media[]> {
  const query = `
    query PopularAnime($page: Int!, $perPage: Int!) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${mediaFields}
        }
      }
    }
  `;

  const result = await anilistFetch<{ Page: { media: Media[] } }>(query, { page, perPage });
  return result.Page.media;
}

export async function searchAnime(search: string, page = 1, perPage = 24): Promise<Media[]> {
  const query = `
    query SearchAnime($search: String!, $page: Int!, $perPage: Int!) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC, isAdult: false) {
          ${mediaFields}
        }
      }
    }
  `;

  const result = await anilistFetch<{ Page: { media: Media[] } }>(query, { search, page, perPage });
  return result.Page.media;
}

export async function getAnimeById(id: number): Promise<Media> {
  const query = `
    query AnimeById($id: Int!) {
      Media(id: $id, type: ANIME) {
        ${mediaFields}
        characters(sort: ROLE, perPage: 12) {
          nodes {
            id
            name {
              full
              native
            }
            image {
              large
            }
          }
        }
      }
    }
  `;

  const result = await anilistFetch<{ Media: Media | null }>(query, { id });

  if (!result.Media) {
    throw new Error("Anime not found");
  }

  return result.Media;
}

export function displayTitle(media: Pick<Media, "title">): string {
  return media.title.english ?? media.title.romaji ?? media.title.native ?? "Untitled anime";
}

export function stripHtml(input: string | null): string {
  if (!input) {
    return "";
  }

  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

