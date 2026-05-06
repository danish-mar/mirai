import { NextRequest } from "next/server";
import { getUserCount, createUser, findUserByEmail } from "@/lib/db/users";
import { jsonOk, jsonError } from "@/lib/api/response";
import { createToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function GET() {
  const count = getUserCount();
  return jsonOk({ needsSetup: count === 0 });
}

export async function POST(request: NextRequest) {
  try {
    const count = getUserCount();
    if (count > 0) {
      return jsonError("Setup already completed", 403);
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return jsonError("Missing required fields", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({
      name,
      email,
      passwordHash,
      isAdmin: true,
    });

    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const cookieStore = await cookies();
    cookieStore.set("mirai_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return jsonOk({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
