import { NextRequest } from "next/server";

export const runtime = "edge";

// HLS playlists (m3u8) list segment/sub-playlist URLs as plain text lines.
// Providers like anidb's hls.anidb.app CDN return them as absolute URLs with
// no Access-Control-Allow-Origin header, so hls.js fetching them directly from
// the browser gets CORS-blocked. Rewrite every URI in the playlist to route
// back through this proxy so segments get the same CORS treatment as the
// playlist itself.
function rewritePlaylist(text: string, baseUrl: string): string {
  const proxied = (raw: string) => `/api/proxy?url=${encodeURIComponent(new URL(raw, baseUrl).toString())}`;
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        return trimmed.replace(/URI="([^"]+)"/, (_, u: string) => `URI="${proxied(u)}"`);
      }
      return proxied(trimmed);
    })
    .join("\n");
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  try {
    const headers = new Headers();
    headers.set("Referer", new URL(url).origin);
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

    const contentType = response.headers.get("content-type") ?? "";
    const isPlaylist = url.includes(".m3u8") || contentType.includes("mpegurl");

    if (isPlaylist && response.ok) {
      const text = await response.text();
      const rewritten = rewritePlaylist(text, response.url || url);
      responseHeaders.delete("content-length");
      return new Response(rewritten, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

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
