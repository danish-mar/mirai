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
    const response = jsonOk({ anime, query: input.q });
    
    // Cache search results in browser for 5 minutes
    response.headers.set("Cache-Control", "public, max-age=300");
    
    return response;
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 400);
  }
}
