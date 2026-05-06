import { NextResponse } from "next/server";
import { env, cookieSecure } from "@/lib/env";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("mirai_session", "", { 
    maxAge: 0, 
    path: "/", 
    secure: cookieSecure,
    httpOnly: true,
    sameSite: "lax"
  });
  return response;
}

export async function GET() {
  const response = NextResponse.redirect(new URL("/login", env.NEXT_PUBLIC_APP_URL));
  response.cookies.set("mirai_session", "", { 
    maxAge: 0, 
    path: "/",
    secure: cookieSecure,
    httpOnly: true,
    sameSite: "lax"
  });
  return response;
}
