"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Media } from "@/lib/anilist";
import { displayTitle } from "@/lib/anilist";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/anime/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions((data.data?.anime || []).slice(0, 6));
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative group flex items-center" ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50 group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(query.length >= 2)}
            placeholder="Search anime..."
            className="h-9 w-64 rounded-full border border-white/20 bg-black/40 pl-10 pr-10 text-sm text-white outline-none backdrop-blur transition focus:border-accent focus:bg-black/60 focus:ring-1 focus:ring-accent"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="size-4 animate-spin text-accent" />
            </div>
          )}
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-80 right-0 overflow-hidden rounded-xl border border-white/10 bg-[#141414]/95 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2">
            {suggestions.map((anime) => {
              const title = displayTitle(anime);
              const cover = anime.coverImage.large || anime.coverImage.extraLarge;
              
              return (
                <Link
                  key={anime.id}
                  href={`/anime/${anime.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/10"
                >
                  <div className="relative aspect-[2/3] h-12 shrink-0 overflow-hidden rounded bg-surface-soft">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {title}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {anime.seasonYear ? `${anime.seasonYear} • ` : ""}
                      {anime.status || "Unknown"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          <button
            onClick={handleSubmit}
            className="flex w-full items-center justify-center bg-white/5 p-3 text-xs font-bold uppercase tracking-wider text-accent transition hover:bg-white/10"
          >
            View all results
          </button>
        </div>
      )}
    </div>
  );
}
