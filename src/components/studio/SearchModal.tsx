import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Play, Search, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useGameSearch } from "@/hooks/useGameSearch";
import type { Game } from "@/lib/games-data";

type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const { results, isSearching } = useGameSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
    setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const openGame = (game: Game) => {
    if (!game.templateId) return;
    onOpenChange(false);
    navigate({ to: "/play", search: { gameId: game.templateId } });
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0a0118]/97 backdrop-blur-md">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-fuchsia-300/30 bg-white/8 px-3 focus-within:border-fuchsia-300/70">
          <Search className="size-4 shrink-0 text-violet-200" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games, categories, creators..."
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-300/60"
          />
          {isSearching && <Loader2 className="size-4 shrink-0 animate-spin text-violet-300" />}
        </label>
        <button
          type="button"
          aria-label="Close search"
          onClick={() => onOpenChange(false)}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/8 text-white transition active:scale-95"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {!query.trim() ? (
          <p className="mt-10 text-center text-sm font-semibold text-violet-300/70">
            Start typing to search games, categories, or creators.
          </p>
        ) : results.length === 0 && !isSearching ? (
          <p className="mt-10 text-center text-sm font-semibold text-violet-300/70">
            No games match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <ul className="space-y-2">
            {results.map((game, index) => (
              <li key={`${game.templateId ?? game.title}-${index}`}>
                <button
                  type="button"
                  onClick={() => openGame(game)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5 text-left transition active:scale-[0.98]"
                >
                  <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xl">
                    {game.thumbnailUrl ? (
                      <img src={game.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      game.emoji
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-black/25 opacity-0 transition group-hover:opacity-100">
                      <Play className="size-4 fill-white text-white" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">{game.title}</span>
                    <span className="mt-0.5 block truncate text-xs font-semibold text-violet-300/80">
                      {game.category} · {game.creator}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
