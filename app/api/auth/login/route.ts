import { NextRequest } from "next/server";
import { findUserByEmail } from "@/lib/db/users";
import { jsonOk, jsonError } from "@/lib/api/response";
import { createToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { cookieSecure } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonError("Missing email or password", 400);
    }

    const user = findUserByEmail(email);
    if (!user) {
      return jsonError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return jsonError("Invalid credentials", 401);
    }

    const token = await createToken({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const cookieStore = await cookies();
    cookieStore.set("mirai_session", token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return jsonOk({ user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
