// Ported from ani-cli 5.0.3, which scrapes anidb.app (allanime.day is now
// gated behind a CAPTCHA and no longer used upstream).
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const BASE = "https://anidb.app";

export interface SearchResult {
  id: string;
  name: string;
  availableEpisodes: Record<string, number>;
  thumbnail?: string;
  description?: string;
  genres?: string[];
  score?: number;
}

export interface EpisodeDetail {
  sub?: string[];
  dub?: string[];
  raw?: string[];
}

export interface SourceUrl {
  sourceName: string;
  sourceUrl: string;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

// showId format is "<slug>-<numeric id>" (e.g. "one-piece-3880")
function numericId(showId: string): string {
  return showId.slice(showId.lastIndexOf("-") + 1);
}

interface CurlResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}

// anidb.app sits behind Cloudflare bot management, which fingerprints the
// TCP/TLS handshake itself. Node's built-in fetch() (undici) gets served the
// "Just a moment..." JS challenge when run inside a container, even though
// the same request from plain curl (from the same host/IP) sails through —
// the same reason ani-cli itself shells out to curl instead of using a
// scripting-language HTTP client. So shell out here too, rather than fetch().
async function curlGet(url: string, ms = 10000): Promise<CurlResponse | null> {
  const timeoutSec = Math.max(1, Math.ceil(ms / 1000));
  const marker = "\n__MIRAI_HTTP_STATUS__:";
  try {
    const { stdout } = await execFileAsync(
      "curl",
      [
        "-sS",
        "-L",
        "-A", AGENT,
        "-H", `Referer: ${BASE}`,
        "--max-time", String(timeoutSec),
        "-w", `${marker}%{http_code}`,
        url,
      ],
      { maxBuffer: 20 * 1024 * 1024 },
    );

    const idx = stdout.lastIndexOf(marker);
    if (idx === -1) return null;
    const body = stdout.slice(0, idx);
    const status = Number(stdout.slice(idx + marker.length).trim());

    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
      json: async () => JSON.parse(body),
    };
  } catch (e) {
    console.error(`[anidb] curl failed for ${url}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchAnime(query: string, _mode: "sub" | "dub" | "raw" = "sub"): Promise<SearchResult[]> {
  const res = await curlGet(`${BASE}/browse?${new URLSearchParams({ q: query })}`, 12000);
  if (!res?.ok) {
    if (res) {
      const body = await res.text().catch(() => "");
      console.error(`[anidb] search failed: HTTP ${res.status} — ${body.slice(0, 300).replace(/\s+/g, " ")}`);
    }
    throw new Error(`Failed to search anime from provider${res ? ` (HTTP ${res.status})` : " (network error)"}.`);
  }
  const html = await res.text();

  const results: SearchResult[] = [];
  const re = /<a href="https:\/\/anidb\.app\/anime\/([a-z0-9-]+-\d+)"[^>]*title="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    results.push({
      id: match[1],
      name: decodeEntities(match[2]),
      availableEpisodes: {},
    });
  }
  return results;
}

// ── Episodes list ─────────────────────────────────────────────────────────────
export async function getEpisodesList(showId: string): Promise<EpisodeDetail> {
  const res = await curlGet(`${BASE}/api/frontend/anime/${numericId(showId)}/episodes`, 10000);
  if (!res?.ok) throw new Error(`Failed to get episodes${res ? ` (HTTP ${res.status})` : " (network error)"}.`);
  const data = (await res.json()) as { episodes?: { number: number }[] };
  const epList = (data.episodes ?? []).map((e) => String(e.number));
  // anidb doesn't split availability by language up front (that's only known
  // once fetching sources for a given episode), so expose the same list for all.
  return { sub: epList, dub: epList, raw: [] };
}

// ── Episode sources ───────────────────────────────────────────────────────────
export async function getEpisodeSources(
  showId: string,
  episodeString: string,
  mode: "sub" | "dub" | "raw" = "sub",
): Promise<SourceUrl[]> {
  const episodesRes = await curlGet(`${BASE}/api/frontend/anime/${numericId(showId)}/episodes`, 10000);
  if (!episodesRes?.ok) return [];
  const episodesData = (await episodesRes.json()) as { episodes?: { id: number; number: number }[] };
  const episode = episodesData.episodes?.find((e) => String(e.number) === episodeString);
  if (!episode) return [];

  const langRes = await curlGet(`${BASE}/api/frontend/episode/${episode.id}/languages`, 10000);
  if (!langRes?.ok) return [];
  const langData = (await langRes.json()) as { languages?: { code: string; embed_url: string }[] };

  const wantCode = mode === "dub" ? "eng" : "jpn";
  const lang = langData.languages?.find((l) => l.code === wantCode);
  if (!lang) return [];

  const embedRes = await curlGet(lang.embed_url, 10000);
  if (!embedRes?.ok) return [];
  const embedHtml = await embedRes.text();
  const fileMatch = embedHtml.match(/file:\s*'([^']+)'/);
  if (!fileMatch) return [];

  const masterRes = await curlGet(fileMatch[1], 10000);
  if (!masterRes?.ok) return [];
  const playlist = await masterRes.text();

  const lines = playlist.split("\n").map((l) => l.trim());
  const streams: { height: number; url: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("#EXT-X-STREAM-INF:")) continue;
    const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
    const url = lines[i + 1];
    if (resMatch && url && !url.startsWith("#")) {
      streams.push({ height: Number(resMatch[1]), url });
    }
  }
  streams.sort((a, b) => b.height - a.height);

  return streams.map((s) => ({ sourceName: `${s.height}p`, sourceUrl: s.url }));
}

// ── Find best match ───────────────────────────────────────────────────────────
export function findBestMatch(results: SearchResult[], targetTitle: string): SearchResult | null {
  if (!results.length) return null;
  const target = targetTitle.toLowerCase().trim();

  return [...results].sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    if (aName === target && bName !== target) return -1;
    if (bName === target && aName !== target) return 1;
    const isSpecific = (s: string) => /season\s*\d|part\s*\d|\bs\d+\b|movie|special|ova/i.test(s);
    if (!isSpecific(target)) {
      if (isSpecific(aName) && !isSpecific(bName)) return 1;
      if (!isSpecific(aName) && isSpecific(bName)) return -1;
    }
    const aInc = aName.includes(target) || target.includes(aName);
    const bInc = bName.includes(target) || target.includes(bName);
    if (aInc && !bInc) return -1;
    if (!aInc && bInc) return 1;
    return aName.length - bName.length;
  })[0];
}
