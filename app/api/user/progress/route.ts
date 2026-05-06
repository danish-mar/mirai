import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { saveProgress } from "@/lib/db/progress";
import { saveProgressSchema } from "@/lib/validators/user";

export const runtime = "nodejs";

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const input = saveProgressSchema.parse(await request.json());
    const progress = saveProgress({
      userId: context.user.id,
      animeId: input.animeId,
      episode: input.episode,
      animeTitle: input.animeTitle,
      coverImage: input.coverImage,
      positionSeconds: input.positionSeconds,
      durationSeconds: input.durationSeconds,
    });
    return jsonOk({ progress });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 400);
  }
});
