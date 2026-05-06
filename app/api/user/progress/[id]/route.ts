import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { getAnimeProgress } from "@/lib/db/progress";
import { progressParamsSchema } from "@/lib/validators/user";

export const runtime = "nodejs";

export const GET = withAuth<{ id: string }>(async (_request: NextRequest, context) => {
  try {
    const params = progressParamsSchema.parse(await context.params);
    const progress = getAnimeProgress(context.user.id, params.id);
    return jsonOk({ progress });
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 400);
  }
});
