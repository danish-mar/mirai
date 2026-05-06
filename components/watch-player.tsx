"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Languages, ExternalLink, Play, RefreshCw } from "lucide-react";

type Source = { sourceName: string; sourceUrl: string };
type Mode = "sub" | "dub";

export function WatchPlayer({
  animeId,
  episode,
  animeTitle,
  coverImage,
}: {
  animeId: number;
  episode: string;
  animeTitle?: string;
  coverImage?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  const [sources, setSources] = useState<Source[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("sub");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch sources from our API ──────────────────────────────────────────────
  const fetchSources = useCallback(async (m: Mode) => {
    setLoading(true);
    setError(null);
    setSources([]);
    setActiveUrl(null);

    try {
      const res = await fetch(`/api/stream/${animeId}/${episode}?mode=${m}`);
      const json = await res.json() as { data?: { sources: Source[] }; error?: string };

      if (!res.ok || !json.data?.sources?.length) {
        throw new Error(json.error ?? "No sources found");
      }

      const srcs = json.data.sources;
      setSources(srcs);
      // Auto-play first source
      playSource(srcs[0].sourceUrl);
    } catch (e: any) {
      setError(e.message ?? "Failed to load stream");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeId, episode]);

  useEffect(() => {
    void fetchSources(mode);
    return () => destroyHls();
  }, [fetchSources, mode]);

  // ── Progress tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    const interval = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || v.duration <= 0 || v.currentTime <= 0) return;
      void fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId, episode, animeTitle, coverImage,
          positionSeconds: v.currentTime,
          durationSeconds: v.duration,
        }),
      });
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [animeId, episode, animeTitle, coverImage]);

  // ── HLS / direct playback — identical to playground.ejs playVideo() ─────────
  function destroyHls() {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }

  function playSource(url: string) {
    setActiveUrl(url);
    const video = videoRef.current;
    if (!video) return;

    destroyHls();

    // Route through our proxy to attach the Referer header and bypass 403 Forbidden
    let proxiedUrl = url;
    if (url.startsWith("http")) {
      proxiedUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    }

    if (url.includes(".m3u8")) {
      // Use hls.js exactly as playground.ejs does
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(proxiedUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            console.error("HLS fatal error:", data);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = proxiedUrl;
        video.addEventListener("loadedmetadata", () => { video.play().catch(() => {}); }, { once: true });
      }
    } else {
      // Direct MP4 (e.g. tools.fast4speed.rsvp URLs)
      video.src = proxiedUrl;
      video.play().catch(() => {});
    }
  }

  const handleModeSwitch = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
  };

  return (
    <>
      {/* hls.js CDN — loaded once, same as playground.ejs */}
      <script src="https://cdn.jsdelivr.net/npm/hls.js@1" async />

      <div className="space-y-0">
        {/* ── Sub/Dub bar ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: "rgba(6,6,15,0.9)", borderBottom: "1px solid rgba(139,92,246,0.12)" }}
        >
          <div className="flex items-center gap-2">
            <Languages className="size-4" style={{ color: "rgba(139,92,246,0.7)" }} />
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Audio</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg p-0.5"
            style={{ background: "rgba(13,13,26,0.9)", border: "1px solid rgba(139,92,246,0.15)" }}>
            {(["sub", "dub"] as const).map((m) => (
              <button key={m} onClick={() => handleModeSwitch(m)}
                className="rounded-md px-3 py-1 text-xs font-bold transition-all duration-200"
                style={{
                  background: mode === m ? "var(--accent)" : "transparent",
                  color: mode === m ? "white" : "rgba(255,255,255,0.4)",
                  boxShadow: mode === m ? "0 0 10px rgba(139,92,246,0.4)" : "none",
                }}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* ── Video container ── */}
        <div className="relative" style={{ background: "#000", aspectRatio: "16/9" }}>
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
              style={{ background: "rgba(0,0,0,0.85)" }}>
              <Loader2 className="size-8 animate-spin" style={{ color: "var(--accent)" }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Fetching {mode.toUpperCase()} stream…
              </p>
            </div>
          )}

          {/* Error overlay */}
          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center z-10"
              style={{ background: "rgba(0,0,0,0.9)" }}>
              <div className="rounded-xl px-5 py-3 text-sm font-medium max-w-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                {error}
              </div>
              <button onClick={() => fetchSources(mode)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all"
                style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <RefreshCw className="size-3.5" /> Retry
              </button>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Try switching between SUB / DUB above.
              </p>
            </div>
          )}

          {/* The actual video element — same as playground.ejs */}
          <video
            ref={videoRef}
            controls
            className="w-full h-full"
            style={{ display: loading || error ? "none" : "block" }}
          />
        </div>

        {/* ── Sources list ── */}
        {sources.length > 0 && !loading && !error && (
          <div className="px-4 py-4"
            style={{ background: "rgba(6,6,15,0.6)", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(255,255,255,0.25)" }}>
              Sources
            </h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => {
                const isActive = activeUrl === src.sourceUrl;
                const isPlayable = src.sourceUrl.startsWith("http");
                return (
                  <div key={i} className="flex items-center gap-1">
                    <button
                      onClick={() => playSource(src.sourceUrl)}
                      disabled={!isPlayable}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                      style={{
                        background: isActive ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.06)",
                        color: isActive ? "white" : isPlayable ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                        border: `1px solid ${isActive ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                        boxShadow: isActive ? "0 0 12px rgba(139,92,246,0.3)" : "none",
                        cursor: isPlayable ? "pointer" : "default",
                      }}>
                      {isActive && <Play className="size-2.5 fill-current" />}
                      {src.sourceName}
                    </button>
                    {isPlayable && (
                      <a href={src.sourceUrl} target="_blank" rel="noreferrer"
                        className="rounded-lg p-1.5 transition-colors"
                        style={{ color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)" }}
                        title="Open in new tab">
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
