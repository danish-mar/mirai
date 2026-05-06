import { NextRequest } from "next/server";
import { searchAnime } from "@/lib/anilist";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { searchQuerySchema } from "@/lib/validators/anime";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const input = searchQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? ""
    });
    const anime = await searchAnime(input.q);
    return jsonOk({ anime, query: input.q });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 400);
  }
}
