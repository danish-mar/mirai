import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/setup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, API routes (they handle their own auth)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const session = request.cookies.get("mirai_session")?.value;

  // ── Bot / Crawler Bypass ──
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = /bot|crawler|spider|criteo|discord|twitter|whatsapp|slack|telegram|facebook|google/i.test(userAgent);

  // Redirect unauthenticated users to login (unless they are a bot/crawler)
  if (!isPublicPath && !session && !isBot) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = session && isPublicPath && pathname !== "/setup"
    ? NextResponse.redirect(new URL("/", request.url))
    : NextResponse.next();

  // Add Cache-Control headers for specific public-facing routes
  const CACHED_PATHS = ["/", "/trending", "/popular"];
  if (CACHED_PATHS.includes(pathname)) {
    // 1 hour browser cache, with 24 hours of background revalidation (SWR)
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
