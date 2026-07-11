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
  const [remixes, setRemixes] = useState(game.remixes ?? 0);
  const open = () => {
    if (game.playUrl) {
      window.location.href = game.playUrl;
      return;
    }
    if (game.templateId) navigate({ to: "/play/$gameId", params: { gameId: game.templateId } });
  };
  const remix = () => {
    setRemixes((value) => value + 1);
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
      className={`animate-float-up group relative overflow-hidden rounded-[1.5rem] border-2 border-fuchsia-200/80 bg-white/85 text-violet-950 shadow-[0_10px_24px_rgba(124,58,237,0.18),0_0_20px_rgba(217,70,239,0.18),inset_0_1px_10px_rgba(255,255,255,0.92)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-300 hover:shadow-[0_14px_30px_rgba(124,58,237,0.24),0_0_26px_rgba(217,70,239,0.32)] ${
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
        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-600 shadow-[0_2px_10px_rgba(124,58,237,0.18)] backdrop-blur">
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
            className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-xl border border-fuchsia-200/70 bg-white/85 text-violet-800 shadow-[0_2px_10px_rgba(124,58,237,0.2)] backdrop-blur transition hover:bg-fuchsia-100 hover:text-fuchsia-600"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        {!game.thumbnailUrl && (
          <div className="flex size-32 items-center justify-center overflow-hidden rounded-3xl bg-white/15 text-6xl shadow-inner backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            {game.emoji}
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-700 shadow-[0_2px_10px_rgba(124,58,237,0.18)] backdrop-blur">
          {game.plays} Plays
        </span>
        <button className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#a855f7,#ec4899)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white opacity-0 shadow-[0_4px_12px_rgba(168,85,247,0.36)] transition-opacity group-hover:opacity-100">
          <Zap className="size-3" /> Instant Play
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-black text-violet-950">{game.title}</h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-violet-500">{game.creator}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-300/70 bg-white/70 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-violet-700 shadow-[inset_0_1px_8px_rgba(255,255,255,0.9)] transition-colors hover:border-violet-500 hover:text-violet-950"
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
            className={`flex h-8 items-center justify-center gap-1 rounded-lg border border-violet-200/80 bg-white/65 text-[10px] font-black shadow-[inset_0_1px_6px_rgba(255,255,255,0.85)] ${liked ? "text-rose-500" : "text-violet-600 hover:text-violet-950"}`}
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
            aria-label="Remix"
            className="flex h-8 items-center justify-center gap-1 rounded-lg border border-violet-200/80 bg-white/65 text-[10px] font-black text-violet-600 shadow-[inset_0_1px_6px_rgba(255,255,255,0.85)] hover:text-violet-950"
            title="Remix"
          >
            <Repeat2 className="size-3.5" /> {remixes}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void share();
            }}
            className="flex h-8 items-center justify-center gap-1 rounded-lg border border-violet-200/80 bg-white/65 text-[10px] font-black text-violet-600 shadow-[inset_0_1px_6px_rgba(255,255,255,0.85)] hover:text-violet-950"
            title="Share"
          >
            <Share2 className="size-3" /> {shares}
          </button>
          <span className="flex h-8 items-center justify-center gap-1 rounded-lg border border-violet-200/80 bg-white/65 text-[10px] font-black text-violet-600 shadow-[inset_0_1px_6px_rgba(255,255,255,0.85)]" title="Creator Score earned">
            <Trophy className="size-3" /> {game.creatorScore ?? 0}
          </span>
        </div>
      </div>
    </article>
  );
}
