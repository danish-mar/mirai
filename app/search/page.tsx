import { AnimeGrid } from "@/components/anime-grid";
import { MotionPage } from "@/components/motion-page";
import { searchAnime } from "@/lib/anilist";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const results = query ? await searchAnime(query) : [];

  return (
    <MotionPage>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Search</p>
        <h1 className="mt-3 text-3xl font-black text-white">{query ? `Results for "${query}"` : "Search Mirai"}</h1>
        <div className="mt-8">
          {results.length ? (
            <AnimeGrid anime={results} />
          ) : (
            <div className="rounded-md border border-white/10 bg-surface p-8 text-sm text-muted">
              {query ? "No anime matched that search." : "Enter a title in the search box to begin."}
            </div>
          )}
        </div>
      </section>
    </MotionPage>
  );
}
