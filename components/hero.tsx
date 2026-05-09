"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, BookmarkPlus, ChevronRight } from "lucide-react";
import type { Media } from "@/lib/anilist/shared";
import { displayTitle, stripHtml } from "@/lib/anilist/shared";
import { motion } from "framer-motion";

export function Hero({ anime }: { anime: Media }) {
  const title = displayTitle(anime);
  const desc = stripHtml(anime.description ?? "");
  const genres = anime.genres?.slice(0, 3) ?? [];

  return (
    <section className="relative min-h-[560px] h-[90vh] max-h-[900px] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        {anime.bannerImage ? (
          <Image
            src={anime.bannerImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
            style={{ filter: "saturate(1.2) brightness(0.55)" }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06060f] via-[#06060f]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06060f]/90 via-[#06060f]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 hero-violet-tint" />
      </div>

      {/* Floating kanji */}
      <div className="kanji-float absolute right-[12%] top-[18%] text-[120px] font-serif text-white select-none pointer-events-none hidden lg:block" aria-hidden>
        未
      </div>
      <div className="kanji-float-slow absolute right-[22%] top-[42%] text-[80px] font-serif text-white select-none pointer-events-none hidden lg:block" aria-hidden>
        来
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 sm:px-12 lg:px-16">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mirai badge */}
          <motion.div
            className="mb-4 flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent hero-accent-glow">
                MIRAI
              </span>
              <span className="text-xs text-white/40 font-light tracking-widest">未来</span>
            </div>
            <div className="h-px flex-1 max-w-[60px] hero-accent-line" />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Featured</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-none mb-2 hero-title-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {title}
          </motion.h1>

          {/* Native title */}
          {anime.title?.native && (
            <motion.p
              className="mb-5 font-serif text-base text-white/40 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              {anime.title.native}
            </motion.p>
          )}

          {/* Meta row */}
          <motion.div
            className="mb-5 flex flex-wrap items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {anime.averageScore && (
              <span className="score-badge px-2.5 py-1 rounded text-xs font-bold">
                ★ {(anime.averageScore / 10).toFixed(1)}
              </span>
            )}
            {anime.seasonYear && (
              <span className="text-xs text-white/60 font-medium">{anime.seasonYear}</span>
            )}
            {anime.episodes && (
              <span className="text-xs text-white/40">{anime.episodes} Episodes</span>
            )}
            {anime.status && (
              <span className="status-badge px-2 py-0.5 rounded text-xs font-medium text-white/60">
                {anime.status.replace("_", " ")}
              </span>
            )}
          </motion.div>

          {/* Genres */}
          {genres.length > 0 && (
            <motion.div
              className="mb-5 flex flex-wrap gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              {genres.map((genre) => (
                <span key={genre} className="genre-tag px-3 py-1 rounded-full text-xs font-medium">
                  {genre}
                </span>
              ))}
            </motion.div>
          )}

          {/* Description */}
          <motion.p
            className="line-clamp-3 text-sm leading-relaxed text-white/60 mb-8 max-w-xl sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {desc}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <Link
              href={`/watch/${anime.id}/1`}
              id="hero-play-btn"
              className="btn-primary group relative flex items-center gap-2.5 overflow-hidden rounded-xl px-7 py-3 text-sm font-bold text-white"
            >
              {/* hover overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 btn-primary-hover-overlay" />
              <Play className="relative z-10 size-4 fill-white" />
              <span className="relative z-10">Watch Now</span>
            </Link>

            <Link
              href={`/anime/${anime.id}`}
              id="hero-info-btn"
              className="btn-ghost flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white/80 transition-colors duration-300 hover:text-white"
            >
              <BookmarkPlus className="size-4" />
              Add to List
            </Link>

            <Link
              href={`/anime/${anime.id}`}
              id="hero-details-btn"
              className="flex items-center gap-1 text-xs font-medium text-white/40 transition hover:text-white/70"
            >
              Details <ChevronRight className="size-3" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none hero-bottom-fade" />
    </section>
  );
}
