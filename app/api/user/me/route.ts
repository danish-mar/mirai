import type { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { findUserById, updateUserProfile } from "@/lib/db/users";
import { addWatchlistItem, isInWatchlist, listWatchlist, removeWatchlistItem } from "@/lib/db/watchlist";
import { getContinueWatching } from "@/lib/db/progress";

export const runtime = "nodejs";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

/** GET /api/user/me — returns profile + watchlist status + continue watching */
export const GET = withAuth(async (_req: NextRequest, context) => {
  try {
    const user = findUserById(context.user.id);
    if (!user) return jsonError("User not found", 404);

    const continueWatching = getContinueWatching(context.user.id, 6);
    const watchlist = listWatchlist(context.user.id);

    return jsonOk({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      continueWatching,
      watchlistCount: watchlist.length,
    });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
});

/** PATCH /api/user/me — update name / avatarUrl */
export const PATCH = withAuth(async (request: NextRequest, context) => {
  try {
    const input = updateProfileSchema.parse(await request.json());
    const updated = updateUserProfile(context.user.id, input);
    return jsonOk({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        isAdmin: updated.isAdmin,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
});
