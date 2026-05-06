import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { addWatchlistItem, isInWatchlist, listWatchlist, removeWatchlistItem } from "@/lib/db/watchlist";
import { addWatchlistSchema } from "@/lib/validators/user";
import { z } from "zod";

export const runtime = "nodejs";

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const url = new URL(request.url);
    const animeId = url.searchParams.get("animeId");
    if (animeId) {
      const inList = isInWatchlist(context.user.id, Number(animeId));
      return jsonOk({ inList });
    }
    const watchlist = listWatchlist(context.user.id);
    return jsonOk({ watchlist });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 500);
  }
});

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const input = addWatchlistSchema.parse(await request.json());
    const item = addWatchlistItem({
      userId: context.user.id,
      animeId: input.animeId,
      title: input.title,
      coverImage: input.coverImage,
    });
    return jsonOk({ item }, 201);
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 400);
  }
});

export const DELETE = withAuth(async (request: NextRequest, context) => {
  try {
    const { animeId } = z.object({ animeId: z.number().int().positive() }).parse(await request.json());
    removeWatchlistItem(context.user.id, animeId);
    return jsonOk({ ok: true });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 400);
  }
});
