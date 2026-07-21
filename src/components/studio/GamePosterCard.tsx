import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { Pencil, Play, X } from "lucide-react";
import { type Game, gradientClass } from "@/lib/games-data";

const FALLBACK_COVER =
  "data:image/svg+xml;base64," +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2b1a4f"/><stop offset="1" stop-color="#0c1230"/>
      </linearGradient></defs>
      <rect width="400" height="500" fill="url(#g)"/>
      <circle cx="200" cy="210" r="64" fill="none" stroke="#8d6bff" stroke-width="6" opacity="0.7"/>
      <text x="200" y="360" text-anchor="middle" fill="#b9a8ff" font-family="monospace" font-size="20">AI GAME</text>
    </svg>`,
  );

export type GamePosterSize = "featured" | "standard" | "compact";

function creatorInitial(creator: string) {
  return creator.replace(/^@/, "").trim().slice(0, 1).toUpperCase() || "?";
}

function PosterArtwork({ game, size }: { game: Game; size: GamePosterSize }) {
  const emojiClass =
    size === "featured" ? "text-6xl" : size === "standard" ? "text-5xl" : "text-4xl";

  if (!game.thumbnailUrl) {
    return (
      <div className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${gradientClass[game.gradient]}`}>
        <span className={`drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] ${emojiClass}`}>{game.emoji}</span>
      </div>
    );
  }

  return (
    <img
      src={game.thumbnailUrl}
      alt=""
      loading="lazy"
      draggable={false}
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.fallback) {
          img.style.display = "none";
          return;
        }
        img.dataset.fallback = "1";
        img.src = FALLBACK_COVER;
      }}
      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
    />
  );
}

export function GamePosterCard({
  game,
  onClick,
  onEdit,
  onDelete,
  size = "standard",
  index = 0,
  metaTheme = "light",
  animated = false,
  className = "",
}: {
  game: Game;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  size?: GamePosterSize;
  index?: number;
  /** Text color for the creator row below the card */
  metaTheme?: "light" | "dark";
  animated?: boolean;
  className?: string;
}) {
  const titleClass =
    size === "featured"
      ? "text-[15px] leading-tight sm:text-base"
      : size === "standard"
        ? "text-[13px] leading-tight sm:text-sm"
        : "text-[11px] leading-tight";

  const playClass =
    size === "featured" ? "text-xs" : size === "standard" ? "text-[11px]" : "text-[10px]";

  const avatarSize = size === "featured" ? "size-8" : size === "standard" ? "size-7" : "size-6";

  const aspectClass = size === "compact" ? "aspect-[3/4]" : "aspect-[4/5]";
  const radiusClass = size === "compact" ? "rounded-xl" : "rounded-[0.9rem] sm:rounded-2xl";

  const stopPress = (event: MouseEvent | ReactPointerEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className={`flex w-full min-w-0 flex-col ${size === "compact" ? "gap-1.5" : "gap-2.5"} ${className}`}
    >
      <article
        onClick={onClick}
        className={`group relative ${aspectClass} w-full cursor-pointer overflow-hidden ${radiusClass} border border-white/35 bg-[#12032b] shadow-[0_10px_28px_rgba(49,16,110,0.28),0_0_0_1px_rgba(168,85,247,0.12)] transition duration-300 active:scale-[0.985] ${
          animated ? "animate-float-up" : ""
        }`}
        style={animated ? { animationDelay: `${index * 50}ms`, opacity: 0 } : undefined}
      >
        <PosterArtwork game={game} size={size} />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,0,24,0.72)_0%,transparent_34%,transparent_58%,rgba(8,0,24,0.55)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

        <h3
          className={`absolute inset-x-0 top-0 line-clamp-2 px-3 pb-1 pt-3 font-display font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] ${titleClass}`}
        >
          {game.title}
        </h3>

        {game.plays && (
          <div
            className={`absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)] backdrop-blur-md ${playClass}`}
          >
            <Play className="size-3 shrink-0 fill-white" />
            <span>{game.plays}</span>
          </div>
        )}

        {onEdit && (
          <button
            type="button"
            title="Edit game"
            aria-label="Edit game"
            onPointerDown={stopPress}
            onPointerUp={stopPress}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-fuchsia-500/85"
          >
            <Pencil className="size-3.5" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            title="Delete game"
            aria-label="Delete game"
            onPointerDown={stopPress}
            onPointerUp={stopPress}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className="absolute right-2 top-12 z-10 grid size-8 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-red-500/85"
          >
            <X className="size-3.5" />
          </button>
        )}
      </article>

      <div className="flex min-w-0 items-center gap-2 px-0.5">
        <span
          className={`grid ${avatarSize} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${gradientClass[game.gradient]} font-black text-white shadow-[0_2px_8px_rgba(124,58,237,0.3)] ring-2 ring-violet-200/80`}
        >
          {game.thumbnailUrl ? (
            <img src={game.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="text-[11px]">{creatorInitial(game.creator)}</span>
          )}
        </span>
        <span
          className={`truncate text-[12px] font-bold ${
            metaTheme === "dark" ? "text-white/92" : "text-violet-950"
          }`}
        >
          {game.creator.length > 16
            ? `${game.creator.slice(0, 6)}…${game.creator.slice(-4)}`
            : game.creator}
        </span>
      </div>
    </div>
  );
}
