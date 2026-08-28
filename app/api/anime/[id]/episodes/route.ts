import { displayTitle, getAnimeById } from "@/lib/anilist";
import { searchAnime, getEpisodesList } from "@/lib/anidb";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { animeIdSchema } from "@/lib/validators/anime";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const { id } = animeIdSchema.parse(await context.params);
    const anime = await getAnimeById(id);
    const title = displayTitle(anime);

    const searchResults = await searchAnime(title);
    if (!searchResults || searchResults.length === 0) {
      return jsonOk({ showId: null, episodes: { sub: [], dub: [], raw: [] } });
    }

    // Find the best match using the same logic as the stream route
    const targetTitle = title.toLowerCase();
    const sortedResults = [...searchResults].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      const aExact = aName === targetTitle;
      const bExact = bName === targetTitle;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const isSpecific = (s: string) => /season|part| s\d|movie|special|ova/i.test(s);
      const targetIsSpecific = isSpecific(targetTitle);

      if (!targetIsSpecific) {
        const aIsSpecific = isSpecific(aName);
        const bIsSpecific = isSpecific(bName);
        if (aIsSpecific && !bIsSpecific) return 1;
        if (!aIsSpecific && bIsSpecific) return -1;
      }

      const aIncludes = aName.includes(targetTitle) || targetTitle.includes(aName);
      const bIncludes = bName.includes(targetTitle) || targetTitle.includes(bName);
      if (aIncludes && !bIncludes) return -1;
      if (!aIncludes && bIncludes) return 1;

      return Math.abs(aName.length - targetTitle.length) - Math.abs(bName.length - targetTitle.length);
    });

    const bestMatch = sortedResults[0];
    const episodesDetail = await getEpisodesList(bestMatch.id);

    return jsonOk({
      showId: bestMatch.id,
      showName: bestMatch.name,
      episodes: {
        sub: episodesDetail.sub || [],
        dub: episodesDetail.dub || [],
        raw: episodesDetail.raw || [],
      }
    });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 502);
  }
}
