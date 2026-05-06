"use client";

import { RotateCcw } from "lucide-react";

export default function AnimeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Anime failed</p>
      <h1 className="mt-3 text-3xl font-bold text-white">Unable to load this anime.</h1>
      <p className="mt-3 text-sm text-muted">{error.message}</p>
      <button onClick={reset} className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white">
        <RotateCcw className="size-4" />
        Retry
      </button>
    </main>
  );
}
