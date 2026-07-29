import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Heart, Pencil, Play, X } from "lucide-react";
import { type Game, gradientClass } from "@/lib/games-data";
import { getThumbnailCandidates } from "@/lib/studio-meta";
import { onImageErrorUnlessUnmounting } from "@/lib/safeImageError";
import defaultCreatorAvatar from "@/assets/navProfile.webp";

export type GamePosterSize = "featured" | "standard" | "compact";

function formatCompactCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function PosterArtwork({ game, size }: { game: Game; size: GamePosterSize }) {
  const emojiClass =
    size === "featured" ? "text-6xl" : size === "standard" ? "text-5xl" : "text-4xl";
  const candidates = useMemo(() => getThumbnailCandidates(game), [game]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const thumbnailUrl = showFallback ? undefined : candidates[candidateIndex];

  useEffect(() => {
    setCandidateIndex(0);
    setShowFallback(false);
  }, [game.id, game.templateId, game.thumbnailUrl, game.familyTemplateId]);

  if (showFallback || !thumbnailUrl) {
    return (
      <div
        className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${gradientClass[game.gradient]}`}
      >
        <span className={`drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] ${emojiClass}`}>
          {game.emoji}
        </span>
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={(event) => {
        onImageErrorUnlessUnmounting(event.currentTarget, () => {
          if (candidateIndex + 1 < candidates.length) {
            setCandidateIndex((current) => current + 1);
            return;
          }
          setShowFallback(true);
        });
      }}
      className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
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
  metaTheme: _metaTheme = "light",
  animated = false,
  className = "",
}: {
  game: Game;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  size?: GamePosterSize;
  index?: number;
  /** @deprecated the footer panel now carries its own fixed dark background */
  metaTheme?: "light" | "dark";
  animated?: boolean;
  className?: string;
}) {
  const titleClass =
    size === "featured" ? "text-[15px]" : size === "standard" ? "text-[13px]" : "text-[12px]";

  const pillClass = size === "compact" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5";

  const avatarSize = size === "featured" ? "size-7" : size === "standard" ? "size-6" : "size-5";

  const footerPadClass =
    size === "featured"
      ? "px-3.5 py-3 gap-2"
      : size === "standard"
        ? "px-3 py-2.5 gap-1.5"
        : "px-2.5 py-2 gap-1";

  const creatorTextClass = size === "compact" ? "text-[10px]" : "text-[11px]";

  const stopPress = (event: MouseEvent | ReactPointerEvent) => {
    event.stopPropagation();
  };

  const shortCreator =
    game.creator.length > 16
      ? `${game.creator.slice(0, 6)}…${game.creator.slice(-4)}`
      : game.creator;

  return (
    <article
      onClick={onClick}
      className={`group relative flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-[17px] border border-white bg-[#160b2e] shadow-[0_10px_28px_rgba(8,4,20,0.45),0_0_0_1px_rgba(168,85,247,0.1)] transition duration-300 active:scale-[0.985] sm:rounded-[21px] ${
        animated ? "animate-float-up" : ""
      } ${className}`}
      style={animated ? { animationDelay: `${index * 50}ms`, opacity: 0 } : undefined}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
        <PosterArtwork game={game} size={size} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,0,24,0)_0%,transparent_55%,rgba(8,0,24,0.45)_100%)]" />

        {game.plays && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)] backdrop-blur-md">
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
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${footerPadClass}`}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h3 className={`min-w-0 truncate font-display font-black text-white ${titleClass}`}>
            {game.title}
          </h3>
          {typeof game.likes === "number" && game.likes > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-violet-200/85">
              <Heart className="size-3 shrink-0" />
              {formatCompactCount(game.likes)}
            </span>
          )}
        </div>

        <span
          className={`max-w-full truncate rounded-full border border-violet-400/40 font-bold uppercase tracking-wide text-violet-200/90 ${pillClass}`}
        >
          {game.category}
        </span>

        <div className="flex min-w-0 items-center gap-1.5 pt-0.5">
          <img
            src={defaultCreatorAvatar}
            alt=""
            draggable={false}
            className={`${avatarSize} shrink-0 rounded-full object-cover ring-1 ring-white/20`}
          />
          <span className={`truncate font-semibold text-violet-200/75 ${creatorTextClass}`}>
            {shortCreator}
          </span>
        </div>
      </div>
    </article>
  );
}
