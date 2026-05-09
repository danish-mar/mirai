import type { Media } from "@/lib/anilist/shared";
import { AnimeCard } from "@/components/anime-card";

export function AnimeGrid({ anime }: { anime: Media[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-6 pt-2 pr-12 scrollbar-hide snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
      {anime.map((item, i) => (
        <div
          key={item.id}
          className="w-[130px] shrink-0 snap-start sm:w-[160px] md:w-[190px]"
          style={{
            animationDelay: `${i * 40}ms`,
          }}
        >
          <AnimeCard anime={item} />
        </div>
      ))}
    </div>
  );
}
