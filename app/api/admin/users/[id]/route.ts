import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { deleteUser } from "@/lib/db/users";
import { jsonOk, jsonError } from "@/lib/api/response";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("mirai_session")?.value;

    if (!token) return jsonError("Unauthorized", 401);

    const adminUser = await verifyToken(token);
    if (!adminUser.isAdmin) return jsonError("Forbidden", 403);

    // Prevent self-deletion
    if (adminUser.id === Number(id)) {
      return jsonError("You cannot delete your own account", 400);
    }

    deleteUser(Number(id));

    return jsonOk({ success: true });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
