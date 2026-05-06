import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/response";
import type { AuthUser } from "@/lib/auth/jwt";
import { verifyToken } from "@/lib/auth/jwt";

export type AuthedContext<TParams = Record<string, string>> = {
  params: Promise<TParams>;
  user: AuthUser;
};

export type AuthedHandler<TParams = Record<string, string>> = (
  request: NextRequest,
  context: AuthedContext<TParams>
) => Promise<Response>;

function bearerToken(request: NextRequest): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length).trim();
  }

  return request.cookies.get("mirai_session")?.value ?? null;
}

export function withAuth<TParams = Record<string, string>>(handler: AuthedHandler<TParams>) {
  return async (request: NextRequest, context: { params: Promise<TParams> }): Promise<Response> => {
    const token = bearerToken(request);
    if (!token) {
      return jsonError("Authentication required", 401);
    }

    try {
      const user = await verifyToken(token);
      return handler(request, { ...context, user });
    } catch {
      return jsonError("Invalid or expired token", 401);
    }
  };
}
