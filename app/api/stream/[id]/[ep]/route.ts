import { displayTitle, getAnimeById } from "@/lib/anilist";
import { searchAnime, getEpisodeSources, getEpisodesList, findBestMatch } from "@/lib/allanime";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { streamParamsSchema } from "@/lib/validators/anime";

export const runtime = "nodejs";

// Cache: AniList ID → allanime showId, in-process only
const showIdCache = new Map<string, string>();

async function resolveShowId(
  anilistId: string | number,
  title: string,
  mode: "sub" | "dub" | "raw",
): Promise<string | null> {
  const cacheKey = `${anilistId}:${mode}`;
  if (showIdCache.has(cacheKey)) return showIdCache.get(cacheKey)!;

  // Try mode first, fall back to sub
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

    // Fetch AniList metadata
    const anime = await getAnimeById(params.id);
    const title = displayTitle(anime);

    // Resolve allanime show ID
    const showId = await resolveShowId(params.id, title, mode);
    if (!showId) {
      return jsonError(`Anime not found on streaming provider: ${title}`, 404);
    }

    // The episode param is an allanime episode string (simple number like "1")
    // Verify it exists in the episode list and try to resolve sources
    let sources = await getEpisodeSources(showId, params.ep, mode);

    // If dub requested but no sources, try same showId with sub
    if (!sources.length && mode === "dub") {
      sources = await getEpisodeSources(showId, params.ep, "sub");
      if (sources.length) {
        return jsonOk({ sources, mode: "sub", note: "Dub not available, showing sub" });
      }
    }

    // If still nothing, try searching with mode "sub" and different showId
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

    return jsonOk({ sources, mode });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 502);
  }
}
