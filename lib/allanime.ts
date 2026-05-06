import crypto from "crypto";

const AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";
const REFR = "https://allmanga.to";
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

// ── Custom hex map (identical to ani-cli and anime-mcp) ───────────────────────
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

// ── Decode tobeparsed blob ────────────────────────────────────────────────────
// Returns raw hex-encoded strings (NOT yet decoded) as sourceUrl — same as anime-mcp
function decodeTobeparsed(blob: string): SourceUrl[] {
  try {
    const buf = Buffer.from(blob, "base64");
    const iv = buf.subarray(1, 13);
    const ctr = Buffer.concat([iv, Buffer.from("00000002", "hex")]);
    const ct = buf.subarray(13);
    const decipher = crypto.createDecipheriv("aes-256-ctr", Buffer.from(ALLANIME_KEY, "hex"), ctr);
    const text = Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");

    const results: SourceUrl[] = [];
    const regex = /"sourceUrl":"--([^"]*)".*?"sourceName":"([^"]*)"/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({ sourceUrl: match[1], sourceName: match[2] });
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

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchAnime(query: string, mode: "sub" | "dub" | "raw" = "sub"): Promise<SearchResult[]> {
  const gql = `query( $search: SearchInput $limit: Int $page: Int $translationType: VaildTranslationTypeEnumType $countryOrigin: VaildCountryOriginEnumType ) { shows( search: $search limit: $limit page: $page translationType: $translationType countryOrigin: $countryOrigin ) { edges { _id name availableEpisodes thumbnail __typename } }}`;
  const vars = {
    search: { allowAdult: false, allowUnknown: false, query },
    limit: 40, page: 1, translationType: mode, countryOrigin: "ALL",
  };

  const res = await safeFetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": AGENT, "Referer": REFR },
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
    headers: { "Content-Type": "application/json", "User-Agent": AGENT, "Referer": REFR },
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

  const encodedVars = vars.replace(/"/g, "%22").replace(/:/g, "%3A").replace(/{/g, "%7B").replace(/}/g, "%7D").replace(/,/g, "%2C");
  const encodedExt = ext.replace(/"/g, "%22").replace(/:/g, "%3A").replace(/{/g, "%7B").replace(/}/g, "%7D").replace(/,/g, "%2C").replace(/ /g, "%20");

  // Step 1: GET with persisted query (primary)
  let rawStr = "";
  const getRes = await safeFetch(`${API_BASE}?variables=${encodedVars}&extensions=${encodedExt}`, {
    method: "GET",
    headers: { "User-Agent": AGENT, "Referer": "https://youtu-chan.com", "Origin": "https://youtu-chan.com" },
  }, 10000);

  if (getRes?.ok) {
    const data = await getRes.json() as any;
    rawStr = JSON.stringify(data);
  }

  // Step 2: POST fallback
  if (!rawStr || !rawStr.includes("tobeparsed")) {
    const gql = `query ($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) { episode( showId: $showId translationType: $translationType episodeString: $episodeString ) { episodeString sourceUrls }}`;
    const postRes = await safeFetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": AGENT, "Referer": REFR },
      body: JSON.stringify({ variables: { showId, translationType: mode, episodeString }, query: gql }),
    }, 10000);
    if (postRes?.ok) {
      const data = await postRes.json() as any;
      rawStr = JSON.stringify(data);
    }
  }

  // Step 3: Extract source entries (raw hex strings from tobeparsed)
  const sources: SourceUrl[] = [];
  const tobeparsedMatch = rawStr.match(/"tobeparsed":"([^"]+)"/);
  if (tobeparsedMatch) {
    sources.push(...decodeTobeparsed(tobeparsedMatch[1]));
  } else {
    const regex = /"sourceUrl":"(?:--)?([^"]*)".*?"sourceName":"([^"]*)"/g;
    let match;
    while ((match = regex.exec(rawStr)) !== null) {
      sources.push({ sourceUrl: match[1], sourceName: match[2] });
    }
  }

  if (sources.length === 0) return [];

  // Step 4: Resolve each hex-encoded source to actual playable URL
  // anime-mcp pattern: decode hex → build URL → fetch clock.json → extract link.link
  // FIX: if decoded path is already a full URL (e.g. Yt-mp4 / tools.fast4speed.rsvp),
  //      use it directly without prepending the allanime base domain.
  const resolvedSources: SourceUrl[] = [];

  await Promise.allSettled(
    sources.map(async (src) => {
      try {
        const decodedPath = decodeCustomHex(src.sourceUrl);

        // If the decoded result is already a full URL, use it directly
        const fetchUrl = decodedPath.startsWith("http")
          ? decodedPath
          : `https://allanime.day${decodedPath}`;

        const res = await safeFetch(fetchUrl, {
          headers: { "User-Agent": AGENT, "Referer": REFR },
        }, 5000);

        if (!res?.ok) return;

        // For direct MP4/HLS sources (like tools.fast4speed.rsvp), the response IS the video
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("video") || contentType.includes("octet-stream")) {
          // It's a direct video stream — use the URL itself
          resolvedSources.push({ sourceName: src.sourceName, sourceUrl: fetchUrl });
          return;
        }

        const data = await res.json() as any;
        const links = data?.links ?? [];
        for (const link of links) {
          if (link.link && typeof link.link === "string") {
            resolvedSources.push({
              sourceName: `${src.sourceName} (${link.resolutionStr ?? "?"})`,
              sourceUrl: link.link,
            });
          }
        }
      } catch {
        // ignore per-provider failures
      }
    }),
  );

  // Return resolved if any, else fall back to decoded paths (same as anime-mcp)
  if (resolvedSources.length > 0) return resolvedSources;

  // Fallback: return decoded paths as-is (for direct-URL providers like Yt-mp4)
  return sources
    .map((src) => {
      const decoded = decodeCustomHex(src.sourceUrl);
      return { sourceName: src.sourceName, sourceUrl: decoded };
    })
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
