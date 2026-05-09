import { getCachedData, setCachedData } from "@/lib/db/general-cache";
import { Media, displayTitle, stripHtml } from "./anilist/shared";

// Re-export shared for convenience in server components
export * from "./anilist/shared";

const ANILIST_URL = "https://graphql.anilist.co";

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
  const cacheKey = `trending:${page}:${perPage}`;
  const cached = getCachedData<Media[]>(cacheKey);
  if (cached) return cached;

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
  const media = result.Page.media;
  setCachedData(cacheKey, media, 86400); // 24H cache
  return media;
}

export async function getPopularAnime(page = 1, perPage = 24): Promise<Media[]> {
  const cacheKey = `popular:${page}:${perPage}`;
  const cached = getCachedData<Media[]>(cacheKey);
  if (cached) return cached;

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
  const media = result.Page.media;
  setCachedData(cacheKey, media, 86400); // 24H cache
  return media;
}

export async function searchAnime(search: string, page = 1, perPage = 24): Promise<Media[]> {
  const cacheKey = `search:${search.toLowerCase()}:${page}:${perPage}`;
  const cached = getCachedData<Media[]>(cacheKey);
  if (cached) return cached;

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
  const media = result.Page.media;
  setCachedData(cacheKey, media, 86400); // 24H cache
  return media;
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
