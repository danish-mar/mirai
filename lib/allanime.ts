import crypto from "crypto";

// ── Updated to match ani-cli 4.14.1 ──────────────────────────────────────────
const AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0";
const REFR = "https://youtu-chan.com";
const API_BASE = "https://api.allanime.day/api";

const ALLANIME_KEY = crypto.createHash("sha256").update("Xot36i3lK3:v1").digest("hex");

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

// ── Custom hex map ────────────────────────────────────────────────────────────
const customHexMap: Record<string, string> = {
  "00": "8", "01": "9", "02": ":", "03": ";", "05": "=", "07": "?", "08": "0", "09": "1", "0a": "2", "0b": "3", "0c": "4", "0d": "5", "0e": "6", "0f": "7",
  "10": "(", "11": ")", "12": "*", "13": "+", "14": ",", "15": "-", "16": ".", "17": "/", "19": "!", "1b": "#", "1c": "$", "1d": "%", "1e": "&",
  "40": "x", "41": "y", "42": "z", "46": "~", "48": "p", "49": "q", "4a": "r", "4b": "s", "4c": "t", "4d": "u", "4e": "v", "4f": "w",
  "50": "h", "51": "i", "52": "j", "53": "k", "54": "l", "55": "m", "56": "n", "57": "o", "59": "a", "5a": "b", "5b": "c", "5c": "d", "5d": "e", "5e": "f", "5f": "g",
  "60": "X", "61": "Y", "62": "Z", "63": "[", "65": "]", "67": "_", "68": "P", "69": "Q", "6a": "R", "6b": "S", "6c": "T", "6d": "U", "6e": "V", "6f": "W",
  "70": "H", "71": "I", "72": "J", "73": "K", "74": "L", "75": "M", "76": "N", "77": "O", "78": "@", "79": "A", "7a": "B", "7b": "C", "7c": "D", "7d": "E", "7e": "F", "7f": "G",
};

function decodeCustomHex(str: string): string {
  let res = "";
  for (let i = 0; i < str.length; i += 2) {
    const chunk = str.substring(i, i + 2).toLowerCase();
    if (customHexMap[chunk]) res += customHexMap[chunk];
    else res += String.fromCharCode(parseInt(chunk, 16));
  }
  return res.replace(/\/clock/g, "/clock.json");
}

// ── NEW: Only decode if the sourceUrl starts with "--" (matches ani-cli 4.14.1) 
// Non-encoded providers (mp4upload, direct URLs) pass through unchanged.
function maybeDecodeCustomHex(str: string): string {
  if (!str.startsWith("--")) return str;
  return decodeCustomHex(str.slice(2));
}

// ── Decode tobeparsed blob ────────────────────────────────────────────────────
function decodeTobeparsed(blob: string): SourceUrl[] {
  try {
    const buf = Buffer.from(blob, "base64");
    const iv = buf.subarray(1, 13);
    const ctr = Buffer.concat([iv, Buffer.from("00000002", "hex")]);
    const ct = buf.subarray(13, buf.length - 16);
    const decipher = crypto.createDecipheriv("aes-256-ctr", Buffer.from(ALLANIME_KEY, "hex"), ctr);
    const text = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");

    const json = JSON.parse(text);
    const sourceUrls = json.episode?.sourceUrls || json.sourceUrls || [];
    
    const results: SourceUrl[] = [];
    for (const src of sourceUrls) {
      if (!src.sourceUrl) continue;
      const rawUrl = src.sourceUrl.startsWith("--") ? src.sourceUrl.slice(2) : src.sourceUrl;
      results.push({ sourceUrl: rawUrl, sourceName: src.sourceName ?? "Unknown" });
    }
    return results;
  } catch (e) {
    console.error("Failed to decode tobeparsed:", e);
    return [];
  }
}

// ── Fetch with timeout ────────────────────────────────────────────────────────
async function safeFetch(url: string, init: RequestInit, ms = 10000): Promise<Response | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

// ── Resolve a single provider source to a playable URL ───────────────────────
// Handles: wixmp (clock.json), mp4upload (HTML scrape), direct URLs (yt/sharepoint)
async function resolveSource(src: SourceUrl): Promise<SourceUrl[]> {
  const decodedPath = maybeDecodeCustomHex(src.sourceUrl);

  // Already a full URL (e.g. Yt-mp4 / tools.fast4speed.rsvp / sharepoint)
  const fetchUrl = decodedPath.startsWith("http")
    ? decodedPath
    : `https://allanime.day${decodedPath}`;

  // ── mp4upload: scrape HTML for `src: "..."` ───────────────────────────────
  // Added in ani-cli 4.14.1 as provider 4
  if (fetchUrl.includes("mp4upload")) {
    const res = await safeFetch(fetchUrl, {
      headers: { "User-Agent": AGENT, "Referer": "https://www.mp4upload.com" },
    }, 8000);
    if (!res?.ok) return [];
    const html = await res.text();
    const match = html.match(/src:\s*"([^"]+)"/);
    if (match) {
      return [{ sourceName: src.sourceName, sourceUrl: match[1] }];
    }
    return [];
  }

  // ── tools.fast4speed.rsvp (Yt provider): use URL directly ─────────────────
  if (fetchUrl.includes("tools.fast4speed.rsvp")) {
    return [{ sourceName: src.sourceName, sourceUrl: fetchUrl }];
  }

  // ── wixmp / allanime CDN: fetch clock.json and extract links ──────────────
  const res = await safeFetch(fetchUrl, {
    headers: { "User-Agent": AGENT, "Referer": REFR },
  }, 5000);

  if (!res?.ok) return [];

  // Direct video stream (content-type video/* or octet-stream)
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("video") || contentType.includes("octet-stream")) {
    return [{ sourceName: src.sourceName, sourceUrl: fetchUrl }];
  }

  try {
    const data = await res.json() as any;
    const links: SourceUrl[] = [];
    for (const link of data?.links ?? []) {
      if (link.link && typeof link.link === "string") {
        links.push({
          sourceName: `${src.sourceName} (${link.resolutionStr ?? "?"})`,
          sourceUrl: link.link,
        });
      }
    }
    return links;
  } catch {
    return [];
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchAnime(query: string, mode: "sub" | "dub" | "raw" = "sub"): Promise<SearchResult[]> {
  const gql = `query( $search: SearchInput $limit: Int $page: Int $translationType: VaildTranslationTypeEnumType $countryOrigin: VaildCountryOriginEnumType ) { shows( search: $search limit: $limit page: $page translationType: $translationType countryOrigin: $countryOrigin ) { edges { _id name availableEpisodes thumbnail __typename } }}`;
  const vars = {
    search: { allowAdult: false, allowUnknown: false, query },
    limit: 40, page: 1, translationType: mode, countryOrigin: "ALL",
  };

  const res = await safeFetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": AGENT,
      "Referer": REFR,
      "Origin": REFR,
    },
    body: JSON.stringify({ variables: vars, query: gql }),
  }, 12000);

  if (!res?.ok) throw new Error("Failed to search anime from provider.");
  const data = await res.json() as any;
  if (!data?.data?.shows?.edges) return [];

  return data.data.shows.edges.map((edge: any) => ({
    id: edge._id,
    name: edge.name,
    availableEpisodes: edge.availableEpisodes,
    thumbnail: edge.thumbnail ?? undefined,
  }));
}

// ── Episodes list ─────────────────────────────────────────────────────────────
export async function getEpisodesList(showId: string): Promise<EpisodeDetail> {
  const gql = `query ($showId: String!) { show( _id: $showId ) { _id availableEpisodesDetail }}`;

  const res = await safeFetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": AGENT,
      "Referer": REFR,
      "Origin": REFR,
    },
    body: JSON.stringify({ variables: { showId }, query: gql }),
  }, 10000);

  if (!res?.ok) throw new Error(`Failed to get episodes: ${res?.statusText}`);
  const data = await res.json() as any;
  return data?.data?.show?.availableEpisodesDetail ?? {};
}

// ── Episode sources ───────────────────────────────────────────────────────────
export async function getEpisodeSources(
  showId: string,
  episodeString: string,
  mode: "sub" | "dub" | "raw" = "sub",
): Promise<SourceUrl[]> {
  const queryHash = "d405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec";
  const vars = JSON.stringify({ showId, translationType: mode, episodeString });
  const ext = JSON.stringify({ persistedQuery: { version: 1, sha256Hash: queryHash } });

  // ani-cli 4.14.1 uses --data-urlencode (proper percent-encoding) for the GET request
  const params = new URLSearchParams({ variables: vars, extensions: ext });

  // Step 1: GET with persisted query (primary) — both Referer and Origin are now youtu-chan.com
  let rawStr = "";
  const getRes = await safeFetch(`${API_BASE}?${params.toString()}`, {
    method: "GET",
    headers: {
      "User-Agent": AGENT,
      "Referer": REFR,
      "Origin": REFR,
    },
  }, 10000);

  if (getRes?.ok) {
    const data = await getRes.json() as any;
    rawStr = JSON.stringify(data);
  }

  // Step 2: POST fallback
  if (!rawStr || (!rawStr.includes("sourceUrl") && !rawStr.includes("tobeparsed"))) {
    const gql = `query ($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) { episode( showId: $showId translationType: $translationType episodeString: $episodeString ) { episodeString sourceUrls }}`;
    const postRes = await safeFetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": AGENT,
        "Referer": REFR,
        "Origin": REFR,
      },
      body: JSON.stringify({ variables: { showId, translationType: mode, episodeString }, query: gql }),
    }, 10000);
    if (postRes?.ok) {
      const data = await postRes.json() as any;
      rawStr = JSON.stringify(data);
    }
  }

  if (!rawStr) return [];

  // Step 3: Extract source entries
  const sources: SourceUrl[] = [];
  
  try {
    const data = JSON.parse(rawStr);
    if (data?.data?.tobeparsed) {
      sources.push(...decodeTobeparsed(data.data.tobeparsed));
    } else if (data?.data?.episode?.sourceUrls) {
      for (const src of data.data.episode.sourceUrls) {
        if (!src.sourceUrl) continue;
        const rawUrl = src.sourceUrl.startsWith("--") ? src.sourceUrl.slice(2) : src.sourceUrl;
        sources.push({ sourceUrl: rawUrl, sourceName: src.sourceName ?? "Unknown" });
      }
    }
  } catch (e) {
    console.error("Failed to parse rawStr as JSON:", e);
  }

  if (sources.length === 0) {
    return [];
  }

  // Step 4: Resolve all sources in parallel (provider-aware)
  const resolved: SourceUrl[] = [];
  await Promise.allSettled(
    sources.map(async (src) => {
      const links = await resolveSource(src);
      resolved.push(...links);
    }),
  );

  if (resolved.length > 0) return resolved;

  // Fallback: return decoded paths for any direct-URL providers
  return sources
    .map((src) => ({
      sourceName: src.sourceName,
      sourceUrl: maybeDecodeCustomHex(src.sourceUrl),
    }))
    .filter((src) => src.sourceUrl.startsWith("http"));
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