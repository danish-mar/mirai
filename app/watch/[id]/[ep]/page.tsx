import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Play, ChevronRight } from "lucide-react";
import { MotionPage } from "@/components/motion-page";
import { PlayerSection } from "./player-section";
import { displayTitle, getAnimeById, stripHtml } from "@/lib/anilist";
import { searchAnime, getEpisodesList, findBestMatch } from "@/lib/allanime";
import { streamParamsSchema } from "@/lib/validators/anime";

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { getEpisodeProgress } from "@/lib/db/progress";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string; ep: string }> }) {
  const parsed = streamParamsSchema.parse(await params);
  const anime = await getAnimeById(parsed.id);
  const title = displayTitle(anime);
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;

  // ── Fetch user progress for history resumption ──
  let initialPosition = 0;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mirai_session")?.value;
    if (token) {
      const user = await verifyToken(token);
      const progress = getEpisodeProgress(user.id, anime.id, parsed.ep);
      if (progress) initialPosition = progress.positionSeconds;
    }
  } catch (e) {
    console.error("Failed to fetch user progress:", e);
  }

  // Resolve available episodes from AllAnime using shared findBestMatch helper
  let sortedEpisodes: string[] = [];
  let dubAvailable = false;
  try {
    const searchResults = await searchAnime(title);
    if (searchResults.length > 0) {
      const best = findBestMatch(searchResults, title) ?? searchResults[0];
      const detail = await getEpisodesList(best.id);
      dubAvailable = (detail.dub?.length ?? 0) > 0;
      const eps = detail.sub?.length ? detail.sub : detail.dub?.length ? detail.dub : [];
      sortedEpisodes = [...eps].sort((a, b) => parseFloat(a) - parseFloat(b));
    }
  } catch (e) {
    console.error("Failed to fetch episodes from provider:", e);
  }

  const isMovie = sortedEpisodes.length === 1 || anime.episodes === 1;

  const currentIndex = sortedEpisodes.indexOf(parsed.ep);
  const prevEp = currentIndex > 0 ? sortedEpisodes[currentIndex - 1] : null;
  const nextEp = currentIndex < sortedEpisodes.length - 1 ? sortedEpisodes[currentIndex + 1] : null;

  const nextEpisodeUrl = nextEp ? `/watch/${anime.id}/${nextEp}` : null;

  // ── Build per-episode thumbnail map from AniList streamingEpisodes ──
  // AniList returns these from licensed sources (e.g. Crunchyroll), may be empty.
  // Format: "Episode 1 - Title" or just "Episode 1"
  const epThumbnailMap = new Map<string, string>();
  for (const se of anime.streamingEpisodes ?? []) {
    if (!se.thumbnail) continue;
    // Extract episode number from title e.g. "Episode 12 - ..." → "12"
    const match = se.title?.match(/episode\s+(\d+(?:\.\d+)?)/i);
    if (match) epThumbnailMap.set(match[1], se.thumbnail);
  }

  return (
    <MotionPage>
      <div className="min-h-screen pt-16" style={{ background: "var(--background)" }}>

        {/* ── Player ── */}
        <section className="mx-auto w-full max-w-[1400px] px-0 sm:px-4 lg:px-6">
          <PlayerSection
            animeId={anime.id}
            episode={parsed.ep}
            animeTitle={title}
            coverImage={cover}
            nextEpisodeUrl={nextEpisodeUrl}
            initialPosition={initialPosition}
          />
        </section>

        {/* ── Info bar ── */}
        <section className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link
                href={`/anime/${anime.id}`}
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium transition-colors duration-200"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <ChevronLeft className="size-3.5" />
                Back to {title}
              </Link>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                  style={{
                    background: isMovie ? "rgba(34,211,238,0.12)" : "rgba(139,92,246,0.12)",
                    color: isMovie ? "#22d3ee" : "var(--accent)",
                    border: `1px solid ${isMovie ? "rgba(34,211,238,0.25)" : "rgba(139,92,246,0.25)"}`,
                  }}
                >
                  {isMovie ? "Movie" : `Episode ${parsed.ep}`}
                </span>
                {dubAvailable && (
                  <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
                    DUB
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white sm:text-3xl leading-tight">{title}</h1>
              {anime.title?.native && (
                <p className="mt-1 font-serif text-sm" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                  {anime.title.native}
                </p>
              )}
            </div>

            {/* Prev / Next nav — hide for movies */}
            {!isMovie && (
              <div className="flex items-center gap-2 shrink-0">
                {prevEp ? (
                  <Link
                    href={`/watch/${anime.id}/${prevEp}`}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 btn-ghost"
                  >
                    <ChevronLeft className="size-3.5" />
                    Ep {prevEp}
                  </Link>
                ) : null}
                {nextEp ? (
                  <Link
                    href={`/watch/${anime.id}/${nextEp}`}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 btn-primary"
                  >
                    Next Ep {nextEp}
                    <ChevronRight className="size-3.5" />
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          {/* Description snippet */}
          <p className="mt-4 max-w-2xl text-sm leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            {stripHtml(anime.description ?? "").substring(0, 220)}
          </p>
        </section>

        {/* ── More episodes ── */}
        {sortedEpisodes.length > 0 && (
          <section className="mx-auto max-w-[1400px] px-4 pb-20 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-end gap-3 border-b pb-4" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
              <h2 className="text-base font-bold text-white tracking-tight">More Episodes</h2>
              <span className="font-serif text-sm" style={{ color: "rgba(139,92,246,0.5)" }}>エピソード</span>
              <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                {sortedEpisodes.length} total
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory">
              {sortedEpisodes.map((epStr) => {
                const isActive = epStr === String(parsed.ep);
                // Per-episode thumbnail from AniList, fallback to show cover
                const epThumb = epThumbnailMap.get(epStr) ?? cover;
                // Episode title from AniList streamingEpisodes if available
                const epTitle = anime.streamingEpisodes?.find(
                  (se) => se.title?.match(/episode\s+(\d+(?:\.\d+)?)/i)?.[1] === epStr
                )?.title?.replace(/^episode\s+\d+(?:\.\d+)?\s*-?\s*/i, "") ?? "";
                return (
                  <Link
                    key={epStr}
                    href={`/watch/${anime.id}/${epStr}`}
                    className="group relative shrink-0 snap-start w-[200px] sm:w-[240px] overflow-hidden rounded-xl transition-all duration-300"
                    style={{
                      border: isActive
                        ? "1px solid var(--accent)"
                        : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: isActive
                        ? "0 0 20px rgba(139,92,246,0.3)"
                        : "none",
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full" style={{ background: "var(--surface-soft)" }}>
                      {epThumb ? (
                        <Image
                          src={epThumb}
                          alt={`Episode ${epStr}`}
                          fill
                          sizes="260px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                          style={{ opacity: isActive ? 0.5 : 0.75, filter: "saturate(1.1)" }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06060f]/90 via-transparent to-transparent" />

                      {/* Play icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="flex size-9 items-center justify-center rounded-full transition-all duration-200"
                          style={{
                            background: isActive
                              ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                              : "rgba(255,255,255,0.12)",
                            backdropFilter: "blur(4px)",
                            boxShadow: isActive ? "0 0 16px rgba(139,92,246,0.5)" : "none",
                          }}
                        >
                          <Play
                            className="size-4 ml-0.5"
                            style={{
                              fill: isActive ? "white" : "rgba(255,255,255,0.8)",
                              color: isActive ? "white" : "rgba(255,255,255,0.8)",
                            }}
                          />
                        </div>
                      </div>

                      {/* Now playing badge */}
                      {isActive && (
                        <div
                          className="absolute top-2 right-2 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ background: "var(--accent)", boxShadow: "0 0 8px rgba(139,92,246,0.5)" }}
                        >
                          Playing
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div className="p-3">
                      <p
                        className="text-xs font-bold"
                        style={{ color: isActive ? "var(--accent)" : "rgba(255,255,255,0.7)" }}
                      >
                        Episode {epStr}
                      </p>
                      <p className="mt-0.5 text-xs line-clamp-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {epTitle || title}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </MotionPage>
  );
}
