import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
};

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, isAdmin: user.isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, secret);
  const id = Number(payload.sub);

  if (
    !Number.isInteger(id) || 
    typeof payload.email !== "string" || 
    typeof payload.name !== "string" ||
    typeof payload.isAdmin !== "boolean"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    id,
    email: payload.email,
    name: payload.name,
    isAdmin: payload.isAdmin
  };
}
