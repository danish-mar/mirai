import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth/jwt";
import { jsonError, jsonOk, errorMessage } from "@/lib/api/response";
import { createUser, findUserByEmail } from "@/lib/db/users";
import { registerSchema } from "@/lib/validators/auth";
import { cookieSecure } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const input = registerSchema.parse(await request.json());
    const existing = findUserByEmail(input.email);

    if (existing) {
      return jsonError("Email is already registered", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = createUser({ email: input.email, name: input.name, passwordHash });
    const token = await createToken({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      isAdmin: user.isAdmin 
    });
    const response = jsonOk(
      {
        token,
        user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin }
      },
      201
    );

    response.cookies.set("mirai_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure,
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error: unknown) {
    return jsonError(errorMessage(error), 400);
  }
}
