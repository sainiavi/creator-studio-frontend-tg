import { ArrowUpRight, Heart, Pencil, Play, Repeat2, Share2, Trophy, Zap } from "lucide-react";
import { type Game, gradientClass } from "@/lib/games-data";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getCurrentUserId } from "@/lib/identity";
import { recordShare, toggleLike } from "@/lib/api/social";

export function GameCard({
  game,
  index = 0,
  onEdit,
}: {
  game: Game;
  index?: number;
  /** Shown as a pencil button on the cover — pass only for the viewer's own games. */
  onEdit?: (game: Game) => void;
}) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(game.likes ?? 0);
  const [shares, setShares] = useState(game.shares ?? 0);
  const open = () => {
    if (game.playUrl) {
      window.location.href = game.playUrl;
      return;
    }
    if (game.templateId) navigate({ to: "/play/$gameId", params: { gameId: game.templateId } });
  };
  const remix = () => {
    const seed = [
      `Remix ${game.title}`,
      game.prompt || `${game.category} game by ${game.creator}`,
      "Keep the core mechanics, physics, controls, and pacing.",
      "Change the theme, characters, visual style, and one gameplay twist.",
    ].join(". ");
    sessionStorage.setItem("kult-remix-prompt", seed);
    navigate({ to: "/create" });
  };
  const like = async () => {
    setLiked((value) => !value);
    setLikes((value) => Math.max(0, value + (liked ? -1 : 1)));
    if (game.templateId) {
      const result = await toggleLike(game.templateId, getCurrentUserId()).catch(() => null);
      if (result) {
        setLiked(result.liked);
        setLikes(result.count);
      }
    }
  };
  const share = async () => {
    if (game.templateId) {
      const result = await recordShare(game.templateId, getCurrentUserId(), "link").catch(() => null);
      if (result) setShares(result.count);
    } else {
      setShares((value) => value + 1);
    }
    const url = game.templateId ? `${window.location.origin}/play/${game.templateId}` : window.location.href;
    await navigator.clipboard?.writeText(url).catch(() => null);
  };

  return (
    <article
      onClick={open}
      className={`animate-float-up group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-neon ${
        game.templateId || game.playUrl ? "cursor-pointer" : ""
      }`}
      style={{ animationDelay: `${index * 60}ms`, opacity: 0 }}
    >
      <div
        className={`relative flex aspect-[4/3.6] items-center justify-center bg-gradient-to-br ${gradientClass[game.gradient]}`}
      >
        {game.thumbnailUrl && (
          <>
            <img
              src={game.thumbnailUrl}
              alt=""
              onError={(event) => {
                // missing cover: fall back to the gradient + emoji tile
                event.currentTarget.style.display = "none";
              }}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
          </>
        )}
        <span className="absolute left-3 top-3 label-mono rounded-md bg-black/35 px-2.5 py-1 text-[10px] text-white backdrop-blur">
          {game.category}
        </span>
        {onEdit && (
          <button
            type="button"
            title="Edit game"
            aria-label="Edit game"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(game);
            }}
            className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg bg-black/55 text-white backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        {!game.thumbnailUrl && (
          <div className="flex size-32 items-center justify-center overflow-hidden rounded-3xl bg-white/15 text-6xl shadow-inner backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            {game.emoji}
          </div>
        )}
        <span className="absolute bottom-3 left-3 label-mono rounded-md bg-black/45 px-2.5 py-1 text-[10px] text-white">
          {game.plays} Plays
        </span>
        <button className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Zap className="size-3" /> Instant Play
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-bold">{game.title}</h3>
          <p className="label-mono mt-1 text-[9px] text-muted-foreground">{game.creator}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/60 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Play className="size-3" /> Play <ArrowUpRight className="size-3" />
        </button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void like();
            }}
            className={`flex h-8 items-center justify-center gap-1 rounded-md border border-border/60 text-[10px] font-bold ${liked ? "bg-rose-500/15 text-rose-400" : "text-muted-foreground hover:text-foreground"}`}
            title="Like"
          >
            <Heart className={`size-3 ${liked ? "fill-current" : ""}`} /> {likes}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              remix();
            }}
            className="flex h-8 items-center justify-center gap-1 rounded-md border border-border/60 text-[10px] font-bold text-muted-foreground hover:text-foreground"
            title="Remix"
          >
            <Repeat2 className="size-3" /> Remix
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void share();
            }}
            className="flex h-8 items-center justify-center gap-1 rounded-md border border-border/60 text-[10px] font-bold text-muted-foreground hover:text-foreground"
            title="Share"
          >
            <Share2 className="size-3" /> {shares}
          </button>
          <span className="flex h-8 items-center justify-center gap-1 rounded-md border border-border/60 text-[10px] font-bold text-muted-foreground" title="Creator Score earned">
            <Trophy className="size-3" /> {game.creatorScore ?? 0}
          </span>
        </div>
      </div>
    </article>
  );
}
