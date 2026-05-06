import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { getNotifications, getUnreadCount, markAllRead, markRead } from "@/lib/db/notifications";

export const runtime = "nodejs";

export const GET = withAuth(async (_req: NextRequest, context) => {
  try {
    const notifications = getNotifications(context.user.id);
    const unreadCount = getUnreadCount(context.user.id);
    return jsonOk({ notifications, unreadCount });
  } catch (error) {
    return jsonError(errorMessage(error), 500);
  }
});

export const PATCH = withAuth(async (request: NextRequest, context) => {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.id) {
      markRead(context.user.id, Number(body.id));
    } else {
      markAllRead(context.user.id);
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
});
