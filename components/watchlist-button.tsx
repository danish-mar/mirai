"use client";

import { useState, useEffect } from "react";
import { BookmarkCheck, BookmarkPlus, Loader2 } from "lucide-react";

export function WatchlistButton({
  animeId,
  title,
  coverImage,
}: {
  animeId: number;
  title: string;
  coverImage: string | null;
}) {
  const [state, setState] = useState<"idle" | "loading" | "checking" | "saved" | "error">("checking");

  useEffect(() => {
    fetch(`/api/user/watchlist?animeId=${animeId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setState(data?.data?.inList ? "saved" : "idle"))
      .catch(() => setState("idle"));
  }, [animeId]);

  async function toggle() {
    if (state === "loading" || state === "checking") return;
    setState("loading");
    try {
      if (state === "saved") {
        const res = await fetch("/api/user/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId }),
        });
        setState(res.ok ? "idle" : "error");
      } else {
        const res = await fetch("/api/user/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeId, title, coverImage }),
        });
        setState(res.ok ? "saved" : "error");
      }
    } catch {
      setState("error");
    }
  }

  const isLoading = state === "loading" || state === "checking";
  const isSaved = state === "saved";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isLoading}
      className="watchlist-btn flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200"
      style={{
        background: isSaved ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${isSaved ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
        color: isSaved ? "#c4b5fd" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
      }}
      title={isSaved ? "Remove from My List" : state === "error" ? "Login required" : "Add to My List"}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="size-4" />
      ) : (
        <BookmarkPlus className="size-4" />
      )}
      <span>{isSaved ? "In My List" : "My List"}</span>
    </button>
  );
}
