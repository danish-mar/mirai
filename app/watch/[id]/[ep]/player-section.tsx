"use client";

import { useRouter } from "next/navigation";
import { WatchPlayer } from "@/components/watch-player";

export function PlayerSection({
  animeId,
  episode,
  animeTitle,
  coverImage,
  nextEpisodeUrl,
  initialPosition,
}: {
  animeId: number;
  episode: string;
  animeTitle?: string;
  coverImage?: string | null;
  nextEpisodeUrl?: string | null;
  initialPosition?: number;
}) {
  const router = useRouter();

  const handleEnded = () => {
    if (nextEpisodeUrl) {
      router.push(nextEpisodeUrl);
    }
  };

  return (
    <div
      className="overflow-hidden rounded-none sm:rounded-2xl"
      style={{
        boxShadow: "0 0 60px rgba(139,92,246,0.15), 0 24px 64px rgba(0,0,0,0.6)",
        border: "1px solid rgba(139,92,246,0.1)",
      }}
    >
      <WatchPlayer
        animeId={animeId}
        episode={episode}
        animeTitle={animeTitle}
        coverImage={coverImage}
        onEnded={handleEnded}
        initialPosition={initialPosition}
      />
    </div>
  );
}
