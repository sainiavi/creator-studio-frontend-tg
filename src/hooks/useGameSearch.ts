import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { resolveGameThumbnail } from "@/lib/studio-meta";
import type { Game } from "@/lib/games-data";

export function useGameSearch(query: string) {
  const [results, setResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      api
        .get(`/games/list?q=${encodeURIComponent(trimmed)}&limit=20`)
        .then((res) => {
          const games: any[] = res.data?.games ?? [];
          const mapped: Game[] = games.map((g: any, index: number) => ({
            title: g.title,
            category: g.category ?? "Game",
            plays: g.views
              ? g.views >= 1000
                ? `${(g.views / 1000).toFixed(1)}K`
                : String(g.views)
              : "New",
            emoji: "🎮",
            gradient: (index % 2 === 0 ? "violet" : "cyan") as "violet" | "cyan",
            creator: g.creator ?? "you",
            creatorId: g.creatorId,
            thumbnailUrl: resolveGameThumbnail(g),
            templateId: g.id ?? g.templateId,
            prompt: g.customization?.prompt || "",
          }));
          setResults(mapped);
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  return { results, isSearching };
}
