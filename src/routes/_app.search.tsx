import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GamePosterCard } from "@/components/studio/GamePosterCard";
import { PageHeader } from "@/components/studio/PageHeader";
import { fetchGamesPage } from "@/lib/api/games";
import type { Game } from "@/lib/games-data";

export const Route = createFileRoute("/_app/search")({
  head: () => ({
    meta: [
      { title: "Search Games — Creator Studio" },
      {
        name: "description",
        content: "Search community games and launch them instantly.",
      },
    ],
  }),
  component: SearchGames,
});

function SearchGames() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
    fetchGamesPage(0, 100)
      .then(({ games: fetchedGames }) => setGames(fetchedGames))
      .catch(() => setError("Games could not be loaded. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return games;
    return games.filter((game) =>
      [game.title, game.category, game.creator, game.prompt ?? ""].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [games, query]);

  const playGame = (game: Game) => {
    if (!game.templateId) return;
    navigate({ to: "/play", search: { gameId: game.templateId } });
  };

  return (
    <div className="relative min-h-screen text-violet-950">
      <PageHeader title="Search Games" subtitle="Find a world and play instantly." />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-3 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <label className="sticky top-3 z-30 mx-auto flex h-12 w-full max-w-3xl items-center gap-3 rounded-2xl border-2 border-fuchsia-300/75 bg-white/90 px-4 shadow-[0_10px_28px_rgba(109,40,217,0.24),inset_0_1px_8px_rgba(255,255,255,0.9)] backdrop-blur-xl focus-within:border-fuchsia-500">
          <Search className="size-5 shrink-0 text-violet-700" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games, categories, or creators..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-violet-950 outline-none placeholder:text-violet-500/65"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="grid size-8 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700"
            >
              <X className="size-4" />
            </button>
          )}
        </label>

        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-black sm:text-2xl">
            {query.trim() ? `Results for “${query.trim()}”` : "All Games"}
          </h2>
          {!loading && (
            <span className="rounded-full border border-violet-300/50 bg-white/60 px-3 py-1 text-xs font-bold text-violet-700">
              {results.length} {results.length === 1 ? "game" : "games"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid min-h-56 place-items-center">
            <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
              <Loader2 className="size-5 animate-spin" /> Loading games...
            </div>
          </div>
        ) : error ? (
          <p className="mt-10 rounded-2xl border border-rose-300 bg-white/75 p-6 text-center text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : results.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-violet-300/50 bg-white/70 p-10 text-center shadow-[0_10px_28px_rgba(109,40,217,0.12)]">
            <Search className="mx-auto size-9 text-violet-400" />
            <h3 className="mt-3 font-display text-xl font-black">No games found</h3>
            <p className="mt-1 text-sm text-violet-700/75">
              Try a different game title, category, or creator.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {results.map((game, index) => (
              <GamePosterCard
                key={`${game.templateId ?? game.title}-${index}`}
                game={game}
                index={index}
                onClick={() => playGame(game)}
                size="standard"
                animated
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
