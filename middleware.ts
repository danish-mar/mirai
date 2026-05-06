import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if setup is needed
  // We can't use better-sqlite3 in edge middleware, so we call our API
  if (pathname !== "/setup") {
    try {
      const res = await fetch(new URL("/api/auth/setup", request.url));
      const { data } = await res.json();
      
      if (data?.needsSetup) {
        return NextResponse.redirect(new URL("/setup", request.url));
      }
    } catch (e) {
      console.error("Middleware setup check failed", e);
    }
  } else {
    // If on /setup, check if already setup
    try {
      const res = await fetch(new URL("/api/auth/setup", request.url));
      const { data } = await res.json();
      
      if (!data?.needsSetup) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (e) {}
  }

  const session = request.cookies.get("mirai_session")?.value;

  // Protect all pages except /login and /setup
  if (!session && pathname !== "/login" && pathname !== "/setup") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
