import { getPopularAnime } from "@/lib/anilist";
import { AnimeCard } from "@/components/anime-card";
import { MotionPage } from "@/components/motion-page";

export const dynamic = "force-dynamic";

export default async function PopularPage() {
  const anime = await getPopularAnime(1, 40);

  return (
    <MotionPage className="min-h-screen pt-28 pb-24" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-16">
        <header className="mb-10 flex flex-col gap-4 pb-8 border-b sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-[0.3em] hero-accent-glow">Discover</span>
              <div className="h-px w-8 hero-accent-line" />
            </div>
            <h1 className="text-4xl font-black text-white sm:text-5xl tracking-tight">
              All-Time Popular
              <span className="ml-3 font-serif text-2xl font-light" style={{ color: "rgba(139,92,246,0.5)" }}>人気</span>
            </h1>
          </div>
          <p className="max-w-xs text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Legendary titles that have defined anime and captured hearts globally.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {anime.map((item) => (
            <div key={item.id} className="transition duration-300 hover:z-10 hover:scale-105 hover:-translate-y-1">
              <AnimeCard anime={item} />
            </div>
          ))}
        </div>
      </div>
    </MotionPage>
  );
}
