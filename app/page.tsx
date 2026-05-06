import { AnimeGrid } from "@/components/anime-grid";
import { Hero } from "@/components/hero";
import { MotionPage } from "@/components/motion-page";
import { getTrendingAnime } from "@/lib/anilist";
import { getContinueWatching } from "@/lib/db/progress";
import { getUserCount } from "@/lib/db/users";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { Play, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mirai · 未来 — Anime Streaming",
  description: "Stream anime in the future. Mirai — your self-hosted anime platform.",
};

function SectionHeading({ title, kanji, subtitle }: { title: string; kanji?: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-end gap-4">
      <div>
        <div className="flex items-baseline gap-2.5 mb-1">
          <h2 className="text-lg font-bold text-white sm:text-xl tracking-tight">{title}</h2>
          {kanji && <span className="section-heading-kanji font-serif text-sm font-light">{kanji}</span>}
        </div>
        {subtitle && <p className="section-heading-subtitle text-xs">{subtitle}</p>}
      </div>
      <div className="section-accent-line flex-1 h-px hidden sm:block" />
    </div>
  );
}

export default async function HomePage() {
  // If no users exist at all, redirect to first-time setup
  if (getUserCount() === 0) {
    redirect("/setup");
  }

  const trending = await getTrendingAnime();
  const [featured, ...rest] = trending;

  // Load continue watching if logged in
  let continueWatching: Awaited<ReturnType<typeof getContinueWatching>> = [];
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mirai_session")?.value;
    if (token) {
      const user = await verifyToken(token);
      continueWatching = await getContinueWatching(user.id, 4);
    }
  } catch {}

  return (
    <MotionPage>
      <div style={{ background: "var(--background)" }}>
        {/* Hero */}
        {featured ? <Hero anime={featured} /> : null}

        <div className="relative z-20 space-y-12 pb-24 pt-2">

          {/* ── Continue Watching ── */}
          {continueWatching.length > 0 && (
            <section className="pl-4 sm:pl-8 lg:pl-12">
              <SectionHeading title="Continue Watching" kanji="続きを見る" subtitle="Pick up where you left off" />
              <div className="flex gap-3 overflow-x-auto pb-4 pr-8 scrollbar-hide snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
                {continueWatching.map(item => (
                  <Link
                    key={`${item.animeId}-${item.episode}`}
                    href={`/watch/${item.animeId}/${item.episode}`}
                    className="group relative shrink-0 snap-start w-[200px] sm:w-[240px] overflow-hidden rounded-xl"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="relative aspect-video w-full" style={{ background: "var(--surface-soft)" }}>
                      {item.coverImage && (
                        <Image src={item.coverImage} alt={item.animeTitle} fill sizes="260px" className="object-cover transition duration-300 group-hover:scale-105" style={{ opacity: 0.65 }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#06060f]/90 via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="play-icon-btn flex size-10 items-center justify-center rounded-full">
                          <Play className="size-4 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      {/* Progress */}
                      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "rgba(0,0,0,0.4)" }}>
                        <div className="h-full transition-all" style={{ width: `${item.percentComplete}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold mb-0.5" style={{ color: "rgba(139,92,246,0.7)" }}>Ep {item.episode} · {item.percentComplete}%</p>
                      <p className="text-xs font-medium text-white/75 line-clamp-2 group-hover:text-white transition-colors">{item.animeTitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Trending ── */}
          <section className="pl-4 sm:pl-8 lg:pl-12">
            <SectionHeading title="Trending Now" kanji="トレンド" subtitle="What everyone is watching" />
            <AnimeGrid anime={rest.length ? rest : trending} />
          </section>

          <div className="relative mx-4 sm:mx-8 lg:mx-12 h-px overflow-visible">
            <div className="section-divider-line absolute inset-0" />
            <span className="section-divider-kanji absolute left-1/2 -translate-x-1/2 -top-3 text-xs font-serif">✦</span>
          </div>

          {/* ── Popular ── */}
          <section className="pl-4 sm:pl-8 lg:pl-12">
            <SectionHeading title="Popular Anime" kanji="人気" subtitle="Fan favorites across all time" />
            <AnimeGrid anime={[...trending].reverse()} />
          </section>

          <div className="relative mx-4 sm:mx-8 lg:mx-12 h-px overflow-visible">
            <div className="section-divider-line absolute inset-0" />
            <span className="section-divider-kanji absolute left-1/2 -translate-x-1/2 -top-3 text-xs font-serif">✦</span>
          </div>

          {/* ── Because you watched ── */}
          <section className="pl-4 sm:pl-8 lg:pl-12">
            <SectionHeading
              title={`Because you watched ${featured?.title.romaji ?? "this"}`}
              kanji="おすすめ"
              subtitle="Picked just for you"
            />
            <AnimeGrid anime={trending.slice(5).concat(trending.slice(0, 5))} />
          </section>
        </div>

        {/* Footer */}
        <div className="footer-glow-line h-px w-full" />
        <footer className="py-8 text-center">
          <p className="footer-text font-serif text-xs tracking-[0.3em]">Mirai · 未来 · {new Date().getFullYear()}</p>
        </footer>
      </div>
    </MotionPage>
  );
}
