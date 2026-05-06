"use client";

import { RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Mirai interrupted</p>
      <h1 className="mt-4 text-3xl font-bold text-white">Something failed while rendering this page.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
      >
        <RotateCcw className="size-4" />
        Retry
      </button>
    </main>
  );
}
