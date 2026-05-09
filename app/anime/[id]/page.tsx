import Image from "next/image";
import Link from "next/link";
import { Play, Clock, Tv } from "lucide-react";
import { MotionPage } from "@/components/motion-page";
import { WatchlistButton } from "@/components/watchlist-button";
import { ShareButton } from "@/components/share-button";
import { displayTitle, getAnimeById, stripHtml } from "@/lib/anilist";
import { searchAnime, getEpisodesList } from "@/lib/allanime";
import { animeIdSchema } from "@/lib/validators/anime";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const parsed = animeIdSchema.parse(await params);
  const anime = await getAnimeById(parsed.id);
  const title = displayTitle(anime);
  const description = stripHtml(anime.description || "").slice(0, 200);
  const image = anime.bannerImage ?? anime.coverImage.extraLarge ?? anime.coverImage.large;

  return {
    title: `${title} · Mirai`,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : [],
      type: "video.tv_show",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = animeIdSchema.parse(await params);
  const anime = await getAnimeById(parsed.id);
  const title = displayTitle(anime);
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;
  const banner = anime.bannerImage ?? cover;

  // Resolve available episodes from AllAnime
  let availableEpisodes: string[] = [];
  try {
    const searchResults = await searchAnime(title);
    if (searchResults.length > 0) {
      const targetTitle = title.toLowerCase();
      const sorted = [...searchResults].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aExact = aName === targetTitle;
        const bExact = bName === targetTitle;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        const isSpecific = (s: string) => /season|part| s\d|movie|special|ova/i.test(s);
        if (!isSpecific(targetTitle)) {
          if (isSpecific(aName) && !isSpecific(bName)) return 1;
          if (!isSpecific(aName) && isSpecific(bName)) return -1;
        }
        const aInc = aName.includes(targetTitle) || targetTitle.includes(aName);
        const bInc = bName.includes(targetTitle) || targetTitle.includes(bName);
        if (aInc && !bInc) return -1;
        if (!aInc && bInc) return 1;
        return Math.abs(aName.length - targetTitle.length) - Math.abs(bName.length - targetTitle.length);
      });
      const detail = await getEpisodesList(sorted[0].id);
      availableEpisodes = detail.sub?.length ? detail.sub : detail.dub?.length ? detail.dub : [];
    }
  } catch (e) {
    console.error("Failed to fetch episodes from provider:", e);
  }

  const sortedEpisodes = [...availableEpisodes].sort((a, b) => parseFloat(a) - parseFloat(b));
  const duration = anime.duration ? `${anime.duration} min` : "~24 min";

  return (
    <MotionPage>
      {/* ── Hero ── */}
      <section className="relative min-h-[85vh] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          {banner ? (
            <Image
              src={banner}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
              style={{ filter: "saturate(1.1) brightness(0.45)" }}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#06060f] via-[#06060f]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06060f]/95 via-[#06060f]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-48 hero-bottom-fade" />
        </div>

        {/* Floating kanji */}
        <div className="kanji-float absolute right-[8%] top-[20%] text-[140px] font-serif text-white select-none pointer-events-none hidden lg:block" aria-hidden>
          {anime.title?.native?.[0] ?? "観"}
        </div>

        <div className="relative z-10 flex min-h-[85vh] flex-col justify-end px-6 pb-16 pt-40 sm:px-12 lg:w-3/4 lg:px-16">
          {/* Badge */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.3em] hero-accent-glow">MIRAI</span>
            <div className="h-px w-12 hero-accent-line" />
            <span className="text-xs text-white/40 uppercase tracking-wider">Series</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-none mb-2 hero-title-shadow">
            {title}
          </h1>
          {anime.title?.native && (
            <p className="mb-5 font-serif text-base text-white/35 tracking-widest">{anime.title.native}</p>
          )}

          {/* Meta */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {anime.averageScore && (
              <span className="score-badge px-2.5 py-1 rounded text-xs font-bold">
                ★ {(anime.averageScore / 10).toFixed(1)}
              </span>
            )}
            {anime.seasonYear && <span className="text-xs text-white/60 font-medium">{anime.seasonYear}</span>}
            {sortedEpisodes.length > 0 && (
              <span className="status-badge px-2 py-0.5 rounded text-xs font-medium text-white/60 flex items-center gap-1">
                <Tv className="size-3" /> {sortedEpisodes.length} Episodes
              </span>
            )}
            <span className="status-badge px-2 py-0.5 rounded text-xs font-medium text-white/60 flex items-center gap-1">
              <Clock className="size-3" /> {duration}
            </span>
            {anime.status && (
              <span className="status-badge px-2 py-0.5 rounded text-xs font-medium text-white/60">
                {anime.status.replace("_", " ")}
              </span>
            )}
          </div>

          {/* Genres */}
          {anime.genres?.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <span key={g} className="genre-tag px-3 py-1 rounded-full text-xs font-medium">{g}</span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="mb-8 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base line-clamp-3">
            {stripHtml(anime.description)}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {sortedEpisodes.length > 0 ? (
              <Link
                href={`/watch/${anime.id}/${sortedEpisodes[0]}`}
                className="btn-primary flex items-center gap-2.5 rounded-xl px-7 py-3 text-sm font-bold text-white"
              >
                <Play className="size-4 fill-white" />
                Play Episode 1
              </Link>
            ) : (
              <span className="flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white/30 cursor-not-allowed status-badge">
                <Play className="size-4" />
                Unavailable
              </span>
            )}
            <WatchlistButton animeId={anime.id} title={title} coverImage={cover} />
            <ShareButton title={title} />
          </div>
        </div>
      </section>

      {/* ── Episodes ── */}
      <section className="relative z-20 -mt-6 mx-auto max-w-7xl px-6 pb-16 sm:px-12 lg:px-16">
        <div className="mb-6 flex items-end gap-4 border-b pb-4" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
          <h2 className="text-xl font-bold text-white tracking-tight">Episodes</h2>
          <span className="font-serif text-sm" style={{ color: "rgba(139,92,246,0.6)" }}>エピソード</span>
          <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {sortedEpisodes.length} available
          </span>
        </div>

        {sortedEpisodes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {sortedEpisodes.map((epStr) => (
              <Link
                key={epStr}
                href={`/watch/${anime.id}/${epStr}`}
                className="episode-row group flex items-center gap-4 rounded-xl p-4 transition-all duration-200"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg sm:w-44" style={{ background: "var(--surface-soft)" }}>
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="11rem"
                      className="object-cover opacity-70 transition duration-300 group-hover:opacity-50 group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="play-icon-btn flex size-9 items-center justify-center rounded-full">
                      <Play className="size-4 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(139,92,246,0.7)" }}>
                    Episode {epStr}
                  </p>
                  <h3 className="font-semibold text-white/80 transition-colors group-hover:text-white">
                    {title}
                  </h3>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{duration}</p>
                </div>

                {/* Play arrow */}
                <div
                  className="shrink-0 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{ background: "rgba(139,92,246,0.15)", color: "var(--accent)" }}
                >
                  <Play className="size-4 fill-current" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <Play className="size-6" style={{ color: "rgba(139,92,246,0.4)" }} />
            </div>
            <p className="text-base font-bold text-white/60">No episodes available</p>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
              This title isn&apos;t on the streaming provider yet.
            </p>
          </div>
        )}
      </section>

      {/* ── Cast ── */}
      {(anime.characters?.nodes ?? []).length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-12 lg:px-16">
          <div className="mb-6 flex items-end gap-3 border-b pb-4" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
            <h2 className="text-xl font-bold text-white tracking-tight">Cast</h2>
            <span className="font-serif text-sm" style={{ color: "rgba(139,92,246,0.6)" }}>キャスト</span>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
            {(anime.characters?.nodes ?? []).slice(0, 16).map((character) => (
              <div key={character.id} className="group flex flex-col gap-2">
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-xl transition-all duration-300"
                  style={{ background: "var(--surface-soft)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {character.image.large ? (
                    <Image
                      src={character.image.large}
                      alt={character.name.full ?? "Character"}
                      fill
                      sizes="10rem"
                      className="object-cover transition duration-300 group-hover:scale-105"
                      style={{ filter: "saturate(1.1)" }}
                    />
                  ) : null}
                  <div className="absolute inset-0 rounded-xl" style={{ boxShadow: "inset 0 -24px 24px rgba(6,6,15,0.7)" }} />
                </div>
                <p className="text-xs font-semibold text-white/80 line-clamp-1 group-hover:text-white transition-colors">
                  {character.name.full ?? character.name.native ?? "Unknown"}
                </p>
                {character.name.native && (
                  <p className="font-serif text-xs line-clamp-1" style={{ color: "rgba(139,92,246,0.5)" }}>
                    {character.name.native}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </MotionPage>
  );
}
