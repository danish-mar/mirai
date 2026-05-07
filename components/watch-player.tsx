"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Loader2, Languages, ExternalLink, Play,
  RefreshCw, SkipForward, Maximize,
} from "lucide-react";

type Source = { sourceName: string; sourceUrl: string };
type Mode = "sub" | "dub";

interface SkipInterval {
  startTime: number;
  endTime: number;
}
interface SkipTimes {
  op?: SkipInterval;
  ed?: SkipInterval;
  recap?: SkipInterval;
}

// ── Fetch MAL ID from AniList GraphQL ────────────────────────────────────────
async function fetchMalId(anilistId: number): Promise<number | null> {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query ($id: Int) { Media(id: $id, type: ANIME) { idMal } }`,
        variables: { id: anilistId },
      }),
    });
    const json = await res.json();
    return json?.data?.Media?.idMal ?? null;
  } catch {
    return null;
  }
}

// ── Fetch skip times from AniSkip ────────────────────────────────────────────
async function fetchSkipTimes(malId: number, episodeNumber: string): Promise<SkipTimes> {
  try {
    const ep = parseFloat(episodeNumber);
    if (isNaN(ep)) return {};
    const res = await fetch(
      `https://api.aniskip.com/v2/skip-times/${malId}/${ep}?types[]=op&types[]=ed&types[]=recap&episodeLength=0`
    );
    const json = await res.json();
    if (!json.found) return {};

    const result: SkipTimes = {};
    for (const item of json.results as Array<{ skipType: string; interval: SkipInterval }>) {
      if (item.skipType === "op") result.op = item.interval;
      else if (item.skipType === "ed") result.ed = item.interval;
      else if (item.skipType === "recap") result.recap = item.interval;
    }
    return result;
  } catch {
    return {};
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function WatchPlayer({
  animeId,
  episode,
  animeTitle,
  coverImage,
  onEnded,
  initialPosition = 0,
}: {
  animeId: number;
  episode: string;
  animeTitle?: string;
  coverImage?: string | null;
  onEnded?: () => void;
  initialPosition?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any | null>(null);
  const initialSeekDone = useRef(false);

  const [sources, setSources] = useState<Source[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mirai_preferred_mode") as Mode | null;
      return saved === "sub" || saved === "dub" ? saved : "sub";
    }
    return "sub";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [skipTimes, setSkipTimes] = useState<SkipTimes>({});
  const [activeSkip, setActiveSkip] = useState<"op" | "ed" | "recap" | null>(null);
  const [nextEpCountdown, setNextEpCountdown] = useState<number | null>(null);

  // ── AniSkip data ─────────────────────────────────────────────────────────
  useEffect(() => {
    setSkipTimes({});
    setActiveSkip(null);
    setNextEpCountdown(null);
    initialSeekDone.current = false;

    fetchMalId(animeId).then((malId) => {
      if (!malId) {
        console.log(`[AniSkip] No MAL ID found for AniList ID: ${animeId}`);
        return;
      }
      console.log(`[AniSkip] Found MAL ID: ${malId} for AniList ID: ${animeId}`);
      fetchSkipTimes(malId, episode).then((times) => {
        if (Object.keys(times).length > 0) {
          console.log("[AniSkip] Skip times loaded:", times);
        } else {
          console.log("[AniSkip] No skip times found for this episode.");
        }
        setSkipTimes(times);
      });
    });
  }, [animeId, episode]);

  // ── Skip handler ──────────────────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    const video = videoRef.current;
    if (!video || !activeSkip) return;
    const seg = skipTimes[activeSkip];
    if (seg) video.currentTime = seg.endTime;
    setActiveSkip(null);
  }, [activeSkip, skipTimes]);

  // ── HLS helpers ───────────────────────────────────────────────────────────
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

    const proxiedUrl = url.startsWith("http")
      ? `/api/proxy?url=${encodeURIComponent(url)}`
      : url;

    const doInitialSeek = () => {
      if (initialPosition > 0 && !initialSeekDone.current) {
        video.currentTime = initialPosition;
        initialSeekDone.current = true;
        console.log(`[Player] Resuming from ${Math.floor(initialPosition / 60)}m${Math.floor(initialPosition % 60)}s`);
      }
    };

    if (url.includes(".m3u8")) {
      const HlsLib = (window as any).Hls;
      if (HlsLib && HlsLib.isSupported()) {
        const hls = new HlsLib();
        hlsRef.current = hls;
        hls.loadSource(proxiedUrl);
        hls.attachMedia(video);
        hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
          doInitialSeek();
          video.play().catch(() => {});
        });
        hls.on(HlsLib.Events.ERROR, (_: unknown, data: { fatal: boolean }) => {
          if (data.fatal) console.error("[HLS] Fatal error:", data);
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = proxiedUrl;
        video.addEventListener("loadedmetadata", () => {
          doInitialSeek();
          video.play().catch(() => {});
        }, { once: true });
      }
    } else {
      // MP4 / direct
      video.src = proxiedUrl;
      video.addEventListener("loadedmetadata", () => {
        doInitialSeek();
        video.play().catch(() => {});
      }, { once: true });
    }
  }

  // ── Fetch sources ─────────────────────────────────────────────────────────
  const fetchSources = useCallback(
    async (m: Mode, forceRefresh = false) => {
      setLoading(true);
      setError(null);
      setSources([]);
      setActiveUrl(null);

      try {
        const url = `/api/stream/${animeId}/${episode}?mode=${m}${forceRefresh ? "&refresh=true" : ""}`;
        const res = await fetch(url);
        const json = (await res.json()) as {
          data?: { sources: Source[] };
          error?: string;
        };
        if (!res.ok || !json.data?.sources?.length) {
          throw new Error(json.error ?? "No sources found");
        }
        const srcs = json.data.sources;
        setSources(srcs);
        playSource(srcs[0].sourceUrl);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load stream");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animeId, episode]
  );

  const handleVideoError = () => {
    console.error("[Player] Video error detected, attempting refresh...");
    void fetchSources(mode, true);
  };

  useEffect(() => {
    void fetchSources(mode);
    return () => destroyHls();
  }, [fetchSources, mode]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const video = videoRef.current;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (!video || tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          video.paused ? video.play().catch(() => {}) : video.pause();
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          video.muted = !video.muted;
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Video events ──────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => onEnded?.();

    const handleTimeUpdate = () => {
      const t = video.currentTime;
      const d = video.duration;

      // Check skip segments
      let foundSkip: "op" | "ed" | "recap" | null = null;
      for (const type of ["op", "ed", "recap"] as const) {
        const seg = skipTimes[type];
        if (seg && t >= seg.startTime && t < seg.endTime - 1) {
          foundSkip = type;
          break;
        }
      }
      setActiveSkip(foundSkip);

      // Next episode countdown (last 10s OR while at outro)
      const isAtOutro = foundSkip === "ed";
      const isAtEnd = d > 0 && t > d - 11;

      if (onEnded && (isAtOutro || isAtEnd)) {
        const remaining = isAtOutro
          ? 10
          : Math.max(0, Math.ceil(d - t));
        setNextEpCountdown(remaining > 0 ? remaining : null);
      } else {
        setNextEpCountdown(null);
      }
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);

    const progressInterval = window.setInterval(() => {
      if (!video || video.duration <= 0 || video.currentTime <= 0) return;
      void fetch("/api/user/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId,
          episode,
          animeTitle,
          coverImage,
          positionSeconds: video.currentTime,
          durationSeconds: video.duration,
        }),
      });
    }, 15_000);

    return () => {
      window.clearInterval(progressInterval);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [animeId, episode, animeTitle, coverImage, onEnded, skipTimes]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) =>
        console.error("[Fullscreen]", err.message)
      );
    } else {
      document.exitFullscreen();
    }
  };

  // ── Mode switch ───────────────────────────────────────────────────────────
  const handleModeSwitch = (m: Mode) => {
    if (m === mode) return;
    setMode(m);
    localStorage.setItem("mirai_preferred_mode", m);
  };

  // Skip label — hide "Skip Outro" when Next Ep countdown is shown
  const skipLabel =
    activeSkip === "op"
      ? "Skip Intro"
      : activeSkip === "recap"
      ? "Skip Recap"
      : activeSkip === "ed" && nextEpCountdown === null
      ? "Skip Outro"
      : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* hls.js CDN */}
      <script src="https://cdn.jsdelivr.net/npm/hls.js@1" async />

      <div className="space-y-0">
        {/* ── Top bar: Audio + Fullscreen ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            background: "rgba(6,6,15,0.9)",
            borderBottom: "1px solid rgba(139,92,246,0.12)",
          }}
        >
          <div className="flex items-center gap-2">
            <Languages className="size-4" style={{ color: "rgba(139,92,246,0.7)" }} />
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Audio
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.4)" }}
              title="Fullscreen (F)"
            >
              <Maximize className="size-4" />
            </button>

            {/* Sub / Dub toggle */}
            <div
              className="flex items-center gap-1 rounded-lg p-0.5"
              style={{
                background: "rgba(13,13,26,0.9)",
                border: "1px solid rgba(139,92,246,0.15)",
              }}
            >
              {(["sub", "dub"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeSwitch(m)}
                  className="rounded-md px-3 py-1 text-xs font-bold transition-all duration-200"
                  style={{
                    background: mode === m ? "var(--accent)" : "transparent",
                    color: mode === m ? "white" : "rgba(255,255,255,0.4)",
                    boxShadow: mode === m ? "0 0 10px rgba(139,92,246,0.4)" : "none",
                  }}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Video container ── */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ background: "#000", aspectRatio: "16/9" }}
        >
          {/* Loading overlay */}
          {loading && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
              style={{ background: "rgba(0,0,0,0.85)" }}
            >
              <Loader2 className="size-8 animate-spin" style={{ color: "var(--accent)" }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Fetching {mode.toUpperCase()} stream…
              </p>
            </div>
          )}

          {/* Error overlay */}
          {!loading && error && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
              style={{ background: "rgba(0,0,0,0.9)" }}
            >
              <div
                className="max-w-sm rounded-xl px-5 py-3 text-sm font-medium"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                }}
              >
                {error}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => void fetchSources(mode)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all"
                  style={{
                    background: "rgba(139,92,246,0.2)",
                    border: "1px solid rgba(139,92,246,0.3)",
                  }}
                >
                  <RefreshCw className="size-3.5" /> Retry
                </button>
                <button
                  onClick={() => void fetchSources(mode, true)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <RefreshCw className="size-3.5" /> Force Refresh
                </button>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Try switching between SUB / DUB above.
              </p>
            </div>
          )}

          {/* AniSkip button */}
          {activeSkip && skipLabel && !loading && !error && (
            <button
              onClick={handleSkip}
              className="absolute bottom-16 right-6 z-20 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "rgba(13,13,26,0.92)",
                border: "1px solid rgba(139,92,246,0.5)",
                boxShadow: "0 8px 32px rgba(139,92,246,0.35)",
                backdropFilter: "blur(12px)",
                animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <SkipForward className="size-4" style={{ color: "var(--accent)" }} />
              {skipLabel}
            </button>
          )}

          {/* Next episode notification */}
          {nextEpCountdown !== null && !loading && !error && (
            <div
              className="absolute right-6 top-6 z-20 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 shadow-2xl backdrop-blur-md"
              style={{ animation: "fadeInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              <div className="relative flex h-10 w-10 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="20" cy="20" r="18"
                    fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"
                  />
                  <circle
                    cx="20" cy="20" r="18"
                    fill="none" stroke="var(--accent)" strokeWidth="3"
                    strokeDasharray={113}
                    strokeDashoffset={113 - (113 * (10 - nextEpCountdown)) / 10}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <span className="text-xs font-black text-white">{nextEpCountdown}</span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--accent)" }}
                >
                  Up Next
                </span>
                <span className="text-sm font-bold text-white">Next Episode</span>
              </div>
              <button
                onClick={() => onEnded?.()}
                className="ml-2 rounded-lg px-3 py-1.5 text-[10px] font-bold text-white transition hover:brightness-110"
                style={{ background: "var(--accent)" }}
              >
                PLAY NOW
              </button>
            </div>
          )}

          {/* Video element */}
          <video
            ref={videoRef}
            controls
            className="h-full w-full"
            onDoubleClick={toggleFullscreen}
            onError={handleVideoError}
            style={{ display: loading || error ? "none" : "block" }}
          />
        </div>

        {/* ── Sources list ── */}
        {sources.length > 0 && !loading && !error && (
          <div
            className="px-4 py-4"
            style={{
              background: "rgba(6,6,15,0.6)",
              borderTop: "1px solid rgba(139,92,246,0.1)",
            }}
          >
            <h3
              className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em]"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
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
                        background: isActive
                          ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                          : "rgba(255,255,255,0.06)",
                        color: isActive
                          ? "white"
                          : isPlayable
                          ? "rgba(255,255,255,0.7)"
                          : "rgba(255,255,255,0.3)",
                        border: `1px solid ${
                          isActive ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"
                        }`,
                        boxShadow: isActive ? "0 0 12px rgba(139,92,246,0.3)" : "none",
                        cursor: isPlayable ? "pointer" : "default",
                      }}
                    >
                      {isActive && <Play className="size-2.5 fill-current" />}
                      {src.sourceName}
                    </button>
                    {isPlayable && (
                      <a
                        href={src.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1.5 transition-colors"
                        style={{
                          color: "rgba(255,255,255,0.2)",
                          background: "rgba(255,255,255,0.04)",
                        }}
                        title="Open in new tab"
                      >
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

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}