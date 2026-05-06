import { getAnimeById } from "@/lib/anilist";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { animeIdSchema } from "@/lib/validators/anime";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    const params = animeIdSchema.parse(await context.params);
    const anime = await getAnimeById(params.id);
    return jsonOk({ anime });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 400);
  }
}
