import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  try {
    const headers = new Headers();
    headers.set("Referer", "https://allmanga.to");
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0");

    // Pass through range header for video seeking
    const range = request.headers.get("range");
    if (range) {
      headers.set("Range", range);
    }

    const response = await fetch(url, {
      headers,
      redirect: "follow",
    });

    const responseHeaders = new Headers(response.headers);
    // Remove headers that might cause issues when proxying
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-security-policy");
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response("Error proxying request", { status: 500 });
  }
}
