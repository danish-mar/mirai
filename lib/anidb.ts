// Ported from ani-cli 5.0.3, which scrapes anidb.app (allanime.day is now
// gated behind a CAPTCHA and no longer used upstream).
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

async function safeFetch(url: string, init: RequestInit = {}, ms = 10000): Promise<Response | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "User-Agent": AGENT, Referer: BASE, ...init.headers },
    });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    console.error(`[anidb] fetch failed for ${url}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchAnime(query: string, _mode: "sub" | "dub" | "raw" = "sub"): Promise<SearchResult[]> {
  const res = await safeFetch(`${BASE}/browse?${new URLSearchParams({ q: query })}`, {}, 12000);
  if (!res?.ok) {
    if (res) {
      const body = await res.text().catch(() => "");
      console.error(`[anidb] search failed: HTTP ${res.status} ${res.statusText} — ${body.slice(0, 300).replace(/\s+/g, " ")}`);
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
  const res = await safeFetch(`${BASE}/api/frontend/anime/${numericId(showId)}/episodes`, {}, 10000);
  if (!res?.ok) throw new Error(`Failed to get episodes: ${res?.statusText}`);
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
  const episodesRes = await safeFetch(`${BASE}/api/frontend/anime/${numericId(showId)}/episodes`, {}, 10000);
  if (!episodesRes?.ok) return [];
  const episodesData = (await episodesRes.json()) as { episodes?: { id: number; number: number }[] };
  const episode = episodesData.episodes?.find((e) => String(e.number) === episodeString);
  if (!episode) return [];

  const langRes = await safeFetch(`${BASE}/api/frontend/episode/${episode.id}/languages`, {}, 10000);
  if (!langRes?.ok) return [];
  const langData = (await langRes.json()) as { languages?: { code: string; embed_url: string }[] };

  const wantCode = mode === "dub" ? "eng" : "jpn";
  const lang = langData.languages?.find((l) => l.code === wantCode);
  if (!lang) return [];

  const embedRes = await safeFetch(lang.embed_url, {}, 10000);
  if (!embedRes?.ok) return [];
  const embedHtml = await embedRes.text();
  const fileMatch = embedHtml.match(/file:\s*'([^']+)'/);
  if (!fileMatch) return [];

  const masterRes = await safeFetch(fileMatch[1], {}, 10000);
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
