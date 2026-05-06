import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { getWatchHistory } from "@/lib/db/progress";

export const runtime = "nodejs";

export const GET = withAuth(async (_req: NextRequest, context) => {
  try {
    const history = getWatchHistory(context.user.id, 50);
    return jsonOk({ history });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
});
