import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { getTrendingAnime } from "@/lib/anilist";

export async function GET(): Promise<Response> {
  try {
    const anime = await getTrendingAnime();
    return jsonOk({ anime });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 502);
  }
}
