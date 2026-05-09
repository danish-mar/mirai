"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    const shareData = {
      title: `${title} · Mirai`,
      text: `Check out ${title} on Mirai!`,
      url: url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="share-btn flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200"
      style={{
        background: copied ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${copied ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.1)"}`,
        color: copied ? "#22d3ee" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(12px)",
      }}
      title="Share anime"
    >
      {copied ? (
        <Check className="size-4" />
      ) : (
        <Share2 className="size-4" />
      )}
      <span>{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}
