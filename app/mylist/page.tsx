import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { listWatchlist } from "@/lib/db/watchlist";
import { getWatchHistory, getContinueWatching } from "@/lib/db/progress";
import { MotionPage } from "@/components/motion-page";
import { AnimeCard } from "@/components/anime-card";
import { Bookmark, Play, Clock, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function MyListPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mirai_session")?.value;
  if (!token) redirect("/login");

  let user;
  try {
    user = await verifyToken(token);
  } catch {
    redirect("/login");
  }

  const watchlist = listWatchlist(user.id);
  const history = getWatchHistory(user.id, 30);
  const continueWatching = getContinueWatching(user.id, 6);

  const completedCount = history.filter(h => h.percentComplete >= 85).length;
  const inProgressCount = history.filter(h => h.percentComplete > 5 && h.percentComplete < 85).length;

  return (
    <MotionPage className="min-h-screen pt-24 pb-24" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-[0.3em] hero-accent-glow">Personal</span>
            <div className="h-px w-8 hero-accent-line" />
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl tracking-tight">
            My List
            <span className="ml-3 font-serif text-2xl font-light" style={{ color: "rgba(139,92,246,0.5)" }}>リスト</span>
          </h1>
        </header>

        {/* ── Stats row ── */}
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Bookmark, label: "Watchlist", value: watchlist.length, color: "#8b5cf6" },
            { icon: TrendingUp, label: "Watched", value: history.length, color: "#22d3ee" },
            { icon: CheckCircle, label: "Completed", value: completedCount, color: "#34d399" },
            { icon: Clock, label: "In Progress", value: inProgressCount, color: "#f472b6" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-2xl p-4"
              style={{ background: "rgba(13,13,26,0.6)", border: "1px solid rgba(139,92,246,0.12)" }}
            >
              <Icon className="size-5 mb-1" style={{ color }} />
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Continue Watching ── */}
        {continueWatching.length > 0 && (
          <section className="mb-12">
            <div className="mb-5 flex items-end gap-3 border-b pb-3" style={{ borderColor: "rgba(139,92,246,0.12)" }}>
              <h2 className="text-lg font-bold text-white">Continue Watching</h2>
              <span className="font-serif text-sm" style={{ color: "rgba(139,92,246,0.55)" }}>続きを見る</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {continueWatching.map(item => (
                <Link
                  key={`${item.animeId}-${item.episode}`}
                  href={`/watch/${item.animeId}/${item.episode}`}
                  className="episode-row group flex items-center gap-3 rounded-2xl p-3 transition-all duration-200"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl sm:w-32" style={{ background: "var(--surface-soft)" }}>
                    {item.coverImage && (
                      <Image src={item.coverImage} alt={item.animeTitle} fill sizes="8rem" className="object-cover transition duration-300 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="play-icon-btn flex size-8 items-center justify-center rounded-full">
                        <Play className="size-3.5 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b" style={{ background: "rgba(0,0,0,0.4)" }}>
                      <div
                        className="h-full rounded-b transition-all duration-500"
                        style={{ width: `${item.percentComplete}%`, background: "var(--accent)" }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: "rgba(139,92,246,0.7)" }}>
                      Ep {item.episode}
                    </p>
                    <p className="text-sm font-semibold text-white/85 line-clamp-2 group-hover:text-white transition-colors leading-snug">
                      {item.animeTitle || `Anime #${item.animeId}`}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percentComplete}%`, background: "var(--accent)" }} />
                      </div>
                      <span className="text-[10px] font-medium shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {item.percentComplete}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Watchlist ── */}
        <section className="mb-12">
          <div className="mb-5 flex items-end gap-3 border-b pb-3" style={{ borderColor: "rgba(139,92,246,0.12)" }}>
            <h2 className="text-lg font-bold text-white">Saved</h2>
            <span className="font-serif text-sm" style={{ color: "rgba(139,92,246,0.55)" }}>保存済み</span>
            <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{watchlist.length} titles</span>
          </div>
          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {watchlist.map(item => (
                <div key={item.animeId} className="transition duration-300 hover:scale-105 hover:-translate-y-1">
                  <AnimeCard
                    anime={{
                      id: item.animeId,
                      title: { romaji: item.title, english: item.title, native: null },
                      coverImage: { extraLarge: item.coverImage, large: item.coverImage, color: null },
                      episodes: null,
                      averageScore: null,
                      genres: [],
                      status: null,
                      seasonYear: null,
                      description: null,
                      bannerImage: null,
                    } as any}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                <Bookmark className="size-6" style={{ color: "rgba(139,92,246,0.5)" }} />
              </div>
              <p className="text-base font-bold text-white/60">Nothing saved yet</p>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Click the bookmark icon on any anime to add it here.</p>
            </div>
          )}
        </section>

        {/* ── Watch History ── */}
        {history.length > 0 && (
          <section>
            <div className="mb-5 flex items-end gap-3 border-b pb-3" style={{ borderColor: "rgba(139,92,246,0.12)" }}>
              <h2 className="text-lg font-bold text-white">History</h2>
              <span className="font-serif text-sm" style={{ color: "rgba(34,211,238,0.5)" }}>履歴</span>
              <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{history.length} titles</span>
            </div>
            <div className="flex flex-col gap-2">
              {history.map(item => (
                <Link
                  key={item.animeId}
                  href={`/watch/${item.animeId}/${item.episode}`}
                  className="episode-row group flex items-center gap-4 rounded-xl p-3 transition-all duration-200"
                >
                  {item.coverImage && (
                    <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg sm:w-24" style={{ background: "var(--surface-soft)" }}>
                      <Image src={item.coverImage} alt={item.animeTitle} fill sizes="6rem" className="object-cover opacity-75 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/80 group-hover:text-white line-clamp-1 transition-colors">
                      {item.animeTitle || `Anime #${item.animeId}`}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(139,92,246,0.6)" }}>Episode {item.episode}</p>
                  </div>
                  {/* Completion status */}
                  <div className="shrink-0 text-right">
                    {item.percentComplete >= 85 ? (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#34d399" }}>
                        <CheckCircle className="size-3" /> Done
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{item.percentComplete}%</span>
                        <div className="h-1 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full" style={{ width: `${item.percentComplete}%`, background: "var(--accent)" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </MotionPage>
  );
}
