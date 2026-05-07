import { displayTitle, getAnimeById } from "@/lib/anilist";
import { searchAnime, getEpisodeSources, findBestMatch } from "@/lib/allanime";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { streamParamsSchema } from "@/lib/validators/anime";
import { getCachedStream, setCachedStream, deleteCachedStream } from "@/lib/db/stream-cache";

export const runtime = "nodejs";

const showIdCache = new Map<string, string>();

async function resolveShowId(
  anilistId: string | number,
  title: string,
  mode: "sub" | "dub" | "raw",
): Promise<string | null> {
  const cacheKey = `${anilistId}:${mode}`;
  if (showIdCache.has(cacheKey)) return showIdCache.get(cacheKey)!;

  for (const m of [mode, "sub" as const, "dub" as const]) {
    try {
      const results = await searchAnime(title, m);
      if (results.length) {
        const match = findBestMatch(results, title) ?? results[0];
        showIdCache.set(cacheKey, match.id);
        return match.id;
      }
    } catch {
      // continue
    }
  }
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; ep: string }> },
): Promise<Response> {
  try {
    const params = streamParamsSchema.parse(await context.params);
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") ?? "sub") as "sub" | "dub" | "raw";
    const refresh = url.searchParams.get("refresh") === "true";

    const animeId = params.id;

    // 1. Check cache first (unless refresh requested)
    if (!refresh) {
      const cached = getCachedStream(animeId, params.ep, mode);
      if (cached) {
        const ageHours = (Date.now() - new Date(cached.createdAt).getTime()) / (1000 * 60 * 60);
        if (ageHours < 8) {
          return jsonOk({ sources: cached.sources, mode: cached.mode, cached: true });
        }
      }
    } else {
      deleteCachedStream(animeId, params.ep, mode);
    }

    // 2. Resolve fresh sources
    const anime = await getAnimeById(params.id);
    const title = displayTitle(anime);

    const showId = await resolveShowId(params.id, title, mode);
    if (!showId) {
      return jsonError(`Anime not found on streaming provider: ${title}`, 404);
    }

    let sources = await getEpisodeSources(showId, params.ep, mode);

    if (!sources.length && mode === "dub") {
      sources = await getEpisodeSources(showId, params.ep, "sub");
      if (sources.length) {
        setCachedStream(animeId, params.ep, mode, sources); // Cache even if it's a fallback
        return jsonOk({ sources, mode: "sub", note: "Dub not available, showing sub" });
      }
    }

    if (!sources.length) {
      const subResults = await searchAnime(title, "sub");
      const subMatch = findBestMatch(subResults, title);
      if (subMatch && subMatch.id !== showId) {
        sources = await getEpisodeSources(subMatch.id, params.ep, "sub");
      }
    }

    if (!sources.length) {
      return jsonError(`No streams found for episode ${params.ep} (tried: ${mode})`, 404);
    }

    // 3. Save to cache and return
    setCachedStream(animeId, params.ep, mode, sources);
    return jsonOk({ sources, mode });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 502);
  }
}
