import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { createUser, findUserByEmail, listUsers } from "@/lib/db/users";
import { jsonOk, jsonError } from "@/lib/api/response";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mirai_session")?.value;

    if (!token) return jsonError("Unauthorized", 401);

    const adminUser = await verifyToken(token);
    if (!adminUser.isAdmin) return jsonError("Forbidden", 403);

    const users = listUsers();
    // Don't return password hashes
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt
    }));

    return jsonOk({ users: safeUsers });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mirai_session")?.value;

    if (!token) return jsonError("Unauthorized", 401);

    const adminUser = await verifyToken(token);
    if (!adminUser.isAdmin) return jsonError("Forbidden", 403);

    const { name, email, password, isAdmin } = await request.json();

    if (!name || !email || !password) {
      return jsonError("Missing required fields", 400);
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return jsonError("Email already in use", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = createUser({
      name,
      email,
      passwordHash,
      isAdmin: !!isAdmin,
    });

    return jsonOk({ 
      user: { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email, 
        isAdmin: newUser.isAdmin 
      } 
    });
  } catch (error: any) {
    return jsonError(error.message, 500);
  }
}
