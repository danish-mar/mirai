import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/api/with-auth";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { findUserById, updateUserPassword } from "@/lib/db/users";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    const { currentPassword, newPassword } = schema.parse(await request.json());
    const user = findUserById(context.user.id);
    if (!user) return jsonError("User not found", 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return jsonError("Current password is incorrect", 401);

    const hash = await bcrypt.hash(newPassword, 12);
    updateUserPassword(context.user.id, hash);

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(errorMessage(error), 400);
  }
});
