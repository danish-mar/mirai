"use client";

import Image from "next/image";
import Link from "next/link";
import type { Media } from "@/lib/anilist/shared";
import { displayTitle } from "@/lib/anilist/shared";
import { Play } from "lucide-react";

export function AnimeCard({ anime }: { anime: Media }) {
  const title = displayTitle(anime);
  const image = anime.coverImage.extraLarge ?? anime.coverImage.large;

  return (
    <Link href={`/anime/${anime.id}`} className="group block" id={`anime-card-${anime.id}`}>
      <div className="anime-card-wrap relative aspect-[2/3] overflow-hidden rounded-xl shadow-lg transition-all duration-300 group-hover:-translate-y-2">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 45vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            style={{ filter: "saturate(1.1)" }}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
            {title}
          </div>
        )}

        {/* Score badge */}
        {anime.averageScore ? (
          <span className="score-badge absolute left-2 top-2 rounded-lg px-2 py-1 text-xs font-bold text-white">
            ★ {(anime.averageScore / 10).toFixed(1)}
          </span>
        ) : null}

        {/* Hover overlay */}
        <div className="anime-card-overlay absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="play-icon-btn flex size-12 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110">
            <Play className="size-5 fill-white text-white ml-0.5" />
          </div>
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-white/80 transition-colors duration-200 group-hover:text-white">
        {title}
      </h3>
      <p className="mt-0.5 text-xs text-accent/70">
        {anime.seasonYear ?? "Unknown"}
        {anime.episodes ? ` · ${anime.episodes} eps` : ""}
      </p>
    </Link>
  );
}
