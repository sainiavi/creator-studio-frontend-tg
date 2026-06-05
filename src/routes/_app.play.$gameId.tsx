import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  Gamepad2,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { ThreePreview } from "@/components/studio/ThreePreview";
import { UnityPreview } from "@/components/studio/UnityPreview";
import { Html5Preview } from "@/components/studio/Html5Preview";
import { gameTemplates } from "@/lib/templates";
import { engineOf, templateEmoji, templateThumbnails } from "@/lib/studio-meta";
import { localPackage } from "@/hooks/useCreatorStudio";
import { gradientClass } from "@/lib/games-data";
import { gradientForId, templateToGame } from "@/lib/studio-meta";
import { useSocial } from "@/hooks/useSocial";
import type { SharePlatform } from "@/lib/api/social";

export const Route = createFileRoute("/_app/play/$gameId")({
  head: ({ params }) => {
    const template = gameTemplates.find((t: any) => t.id === params.gameId);
    return {
      meta: [
        { title: `${template?.name ?? "Play"} - Creator Studio` },
        { name: "description", content: "Play this game instantly from the social feed." },
      ],
    };
  },
  component: PlayFeed,
});

const creatorProfiles = [
  { handle: "@archeologist", name: "archeologist", avatar: "A", bio: "Browse their games" },
  { handle: "@neo", name: "neo", avatar: "N", bio: "Fast arcade experiments" },
  { handle: "@luma", name: "luma", avatar: "L", bio: "Puzzle loops and bright worlds" },
  { handle: "@pixel", name: "pixel", avatar: "P", bio: "Tiny games, big scores" },
  { handle: "@orbit", name: "orbit", avatar: "O", bio: "3D web playgrounds" },
];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function PlayFeed() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const navigationLockedRef = useRef(false);
  const index = Math.max(0, gameTemplates.findIndex((t: any) => t.id === gameId));
  const template = gameTemplates[index] ?? gameTemplates[0];
  const game = templateToGame(template, index);
  const engine = engineOf(template);
  const profile = creatorProfiles[index % creatorProfiles.length];
  const pkg = localPackage(template, {
    prompt: `${template.name} playable feed session`,
    theme: "neon",
    difficulty: "normal",
    customization: "light",
    extra: "none",
  });
  const previous = gameTemplates[(index - 1 + gameTemplates.length) % gameTemplates.length];
  const next = gameTemplates[(index + 1) % gameTemplates.length];

  const social = useSocial(gameId);

  useEffect(() => {
    const goToFeedGame = (targetId: string) => {
      if (navigationLockedRef.current) return;
      navigationLockedRef.current = true;
      navigate({ to: "/play/$gameId", params: { gameId: targetId } });
      window.setTimeout(() => {
        navigationLockedRef.current = false;
      }, 650);
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 55 || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      event.preventDefault();
      goToFeedGame(event.deltaY > 0 ? next.id : previous.id);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const start = touchStartRef.current;
      const touch = event.changedTouches[0];
      touchStartRef.current = null;
      if (!start || !touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (Math.abs(deltaY) < 70 || Math.abs(deltaY) < Math.abs(deltaX) * 1.25) return;
      goToFeedGame(deltaY < 0 ? next.id : previous.id);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate, next.id, previous.id]);

  const socialButtons = (
    <>
      <ShareButton
        count={social.shareCount}
        open={social.shareMenuOpen}
        onToggle={() => social.setShareMenuOpen(!social.shareMenuOpen)}
        onShare={social.handleShare}
        template={template}
      />
      <ActionButton
        icon={<MessageCircle className="size-6" />}
        label={social.commentCount > 0 ? formatCount(social.commentCount) : "0"}
        onClick={() => social.setCommentsOpen(!social.commentsOpen)}
        active={social.commentsOpen}
      />
      <LikeButton
        liked={social.liked}
        count={social.likeCount}
        onToggle={social.handleLike}
        animating={social.likeAnimating}
      />
      <FavoriteButton
        favorited={social.favorited}
        count={social.favoriteCount}
        onToggle={social.handleFavorite}
        animating={social.favoriteAnimating}
      />
    </>
  );

  return (
    <div className="h-[100dvh] overflow-hidden bg-background lg:h-auto lg:min-h-screen">
      <div className="mx-auto grid h-[calc(100dvh-64px)] w-full max-w-[1360px] grid-cols-1 items-start gap-0 overflow-hidden px-0 py-0 lg:h-auto lg:min-h-screen lg:grid-cols-[minmax(0,1fr)_88px] lg:items-center lg:gap-4 lg:overflow-visible lg:px-8 lg:py-4 xl:grid-cols-[minmax(0,1fr)_96px_72px]">
        <section className="grid h-full place-items-start overflow-hidden lg:min-h-[calc(100vh-2rem)] lg:place-items-center lg:overflow-visible">
          <div className="relative h-full w-full max-w-none overflow-hidden border-0 border-border/60 bg-black shadow-[0_30px_90px_-45px_oklch(0_0_0)] lg:h-[calc(100vh-3rem)] lg:max-h-[920px] lg:max-w-[960px] lg:rounded-[2rem] lg:border">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradientClass[gradientForId(template.id)]} opacity-35`}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,oklch(1_0_0_/_0.18),transparent_28%),linear-gradient(180deg,transparent_42%,oklch(0.08_0.02_280_/_0.92))]" />
            <div className="relative z-10 flex h-full flex-col justify-start px-0 py-0 sm:px-6 sm:py-4 lg:justify-center lg:py-6">
              <div className="mx-auto flex h-full w-full max-w-[880px] flex-col lg:block lg:h-auto">
                <div className="mb-2 flex shrink-0 items-center justify-between gap-3 px-4 pt-3 sm:px-0 sm:pt-0 lg:mb-3">
                  <div className="min-w-0">
                    <p className="label-mono text-[10px] text-white/70">{game.category}</p>
                    <h1 className="truncate font-display text-2xl font-black text-white sm:text-3xl">{template.name}</h1>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                    <Gamepad2 className="size-4" /> {engine === "unity" ? "Unity" : engine === "construct" ? "HTML5" : "Canvas"}
                  </span>
                </div>

                <div className={`feed-game-frame min-h-0 flex-1 ${
                  engine === "unity"
                    ? "feed-game-frame--unity"
                    : engine === "construct"
                      ? "feed-game-frame--construct"
                      : "feed-game-frame--canvas"
                } overflow-hidden border-y border-white/15 bg-black/80 shadow-2xl sm:rounded-2xl sm:border lg:flex-none`}>
                  {engine === "unity" ? (
                    <UnityPreview templateId={template.id} />
                  ) : engine === "construct" ? (
                    <Html5Preview templateId={template.id} />
                  ) : (
                    <ThreePreview gamePackage={pkg} />
                  )}
                </div>

                <div className="mt-3 flex shrink-0 items-center justify-center gap-4 px-3 sm:gap-8 sm:px-0 lg:hidden">
                  {socialButtons}
                </div>

                <div className="mt-3 flex shrink-0 items-end justify-between gap-3 px-4 pb-3 sm:px-0 sm:pb-0 lg:mt-4 lg:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="grid size-12 shrink-0 place-items-center rounded-full border border-white/25 bg-white/15 font-display text-lg font-black text-white">
                        {profile.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-white">{profile.name}</p>
                        <p className="truncate text-sm font-semibold text-white/70">{profile.bio}</p>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 max-w-[520px] text-sm font-semibold text-white/80 lg:mt-3">
                      {template.mechanic} {template.controls}
                    </p>
                  </div>
                  <button className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-white/90">
                    <UserPlus className="size-4" /> Follow
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden items-center justify-center gap-3 lg:flex lg:flex-col">
          {socialButtons}
          <div className="hidden size-12 place-items-center rounded-full border border-white/10 bg-card text-2xl lg:grid">
            {templateEmoji[template.id] ?? game.emoji}
          </div>
        </aside>

        <nav className="fixed right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-4 xl:flex">
          <FeedLink to={previous.id} label="Previous" icon={<ArrowUp className="size-7" />} />
          <FeedLink to={next.id} label="Next" icon={<ArrowDown className="size-7" />} />
        </nav>
      </div>

      {/* Comments Panel */}
      <CommentsPanel
        open={social.commentsOpen}
        onClose={() => social.setCommentsOpen(false)}
        comments={social.comments}
        loading={social.commentsLoading}
        onAdd={social.handleAddComment}
        onDelete={social.handleDeleteComment}
        onLoadMore={social.loadMoreComments}
        hasMore={social.hasMoreComments}
        count={social.commentCount}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Interactive Buttons
// ═══════════════════════════════════════════════════════════════════════════

function ActionButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex min-w-14 flex-col items-center gap-2 text-white transition-transform active:scale-90 sm:min-w-16 ${active ? "text-white/100" : ""}`}
    >
      <span className={`grid size-12 place-items-center rounded-full transition sm:size-14 ${
        active ? "bg-white/25 ring-1 ring-white/30" : "bg-white/10 group-hover:bg-white/18"
      }`}>
        {icon}
      </span>
      <span className="text-[11px] font-black sm:text-xs">{label}</span>
    </button>
  );
}

function LikeButton({
  liked,
  count,
  onToggle,
  animating,
}: {
  liked: boolean;
  count: number;
  onToggle: () => void;
  animating: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className="group flex min-w-14 flex-col items-center gap-2 transition-transform active:scale-90 sm:min-w-16"
    >
      <span
        className={`grid size-12 place-items-center rounded-full transition sm:size-14 ${
          liked
            ? "bg-rose-500/30 ring-1 ring-rose-400/50"
            : "bg-white/10 group-hover:bg-white/18"
        }`}
      >
        <Heart
          className={`size-6 transition-all ${
            liked ? "fill-rose-400 text-rose-400" : "text-white"
          } ${animating ? "scale-125" : "scale-100"}`}
        />
      </span>
      <span className={`text-[11px] font-black sm:text-xs ${liked ? "text-rose-400" : "text-white"}`}>
        {count > 0 ? formatCount(count) : "Like"}
      </span>
    </button>
  );
}

function FavoriteButton({
  favorited,
  count,
  onToggle,
  animating,
}: {
  favorited: boolean;
  count: number;
  onToggle: () => void;
  animating: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className="group flex min-w-14 flex-col items-center gap-2 transition-transform active:scale-90 sm:min-w-16"
    >
      <span
        className={`grid size-12 place-items-center rounded-full transition sm:size-14 ${
          favorited
            ? "bg-amber-500/30 ring-1 ring-amber-400/50"
            : "bg-white/10 group-hover:bg-white/18"
        }`}
      >
        {favorited ? (
          <BookmarkCheck
            className={`size-6 text-amber-400 transition-all ${animating ? "scale-125" : "scale-100"}`}
          />
        ) : (
          <Bookmark className="size-6 text-white" />
        )}
      </span>
      <span className={`text-[11px] font-black sm:text-xs ${favorited ? "text-amber-400" : "text-white"}`}>
        {count > 0 ? formatCount(count) : "Favorite"}
      </span>
    </button>
  );
}

function ShareButton({
  count,
  open,
  onToggle,
  onShare,
  template,
}: {
  count: number;
  open: boolean;
  onToggle: () => void;
  onShare: (platform?: SharePlatform) => Promise<void>;
  template: any;
}) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const url = `${window.location.origin}/play/${template.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setToastMessage("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setToastMessage(""), 3000);
      await onShare("link");
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  const handlePlatformClick = async (platform: SharePlatform) => {
    await onShare(platform);
    if (platform === "discord" || platform === "instagram") {
      setToastMessage(
        platform === "discord"
          ? "Link copied! Paste it in Discord."
          : "Link copied! Ready to share on Instagram."
      );
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      onToggle(); // Close modal for other redirect shares
    }
  };

  const platforms = [
    { 
      label: "Copy Link", 
      platform: "link" as const, 
      icon: (
        <svg className="size-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      ),
      bgClass: "bg-white/10 hover:bg-white/20 border-white/5",
      action: handleCopy,
    },
    { 
      label: "X (Twitter)", 
      platform: "twitter" as const, 
      icon: (
        <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bgClass: "bg-black hover:bg-zinc-900 border-white/10",
      action: () => handlePlatformClick("twitter"),
    },
    { 
      label: "WhatsApp", 
      platform: "whatsapp" as const, 
      icon: (
        <svg className="size-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
        </svg>
      ),
      bgClass: "bg-[#25D366] hover:bg-[#20ba59] border-green-400/20",
      action: () => handlePlatformClick("whatsapp"),
    },
    { 
      label: "Discord", 
      platform: "discord" as const, 
      icon: (
        <svg className="size-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.46-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03a.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
        </svg>
      ),
      bgClass: "bg-[#5865F2] hover:bg-[#4752c4] border-indigo-400/20",
      action: () => handlePlatformClick("discord"),
    },
    { 
      label: "Instagram", 
      platform: "instagram" as const, 
      icon: (
        <svg className="size-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
      bgClass: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-90 border-pink-400/20",
      action: () => handlePlatformClick("instagram"),
    },
    { 
      label: "Telegram", 
      platform: "telegram" as const, 
      icon: (
        <svg className="size-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.61l-1.91 9c-.14.65-.53.81-1.08.5l-2.91-2.15-1.4 1.35c-.15.15-.28.28-.58.28l.2-2.94 5.35-4.83c.23-.2-.05-.32-.36-.12l-6.62 4.17-2.85-.89c-.62-.19-.63-.62.13-.91l11.13-4.29c.51-.19.96.11.8.88z" />
        </svg>
      ),
      bgClass: "bg-[#26A5E4] hover:bg-[#2295ce] border-sky-400/20",
      action: () => handlePlatformClick("telegram"),
    },
    { 
      label: "Email", 
      platform: "email" as const, 
      icon: (
        <svg className="size-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
      bgClass: "bg-zinc-800 hover:bg-zinc-700 border-zinc-700/50",
      action: () => handlePlatformClick("email"),
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="group flex min-w-14 flex-col items-center gap-2 text-white transition-transform active:scale-90 sm:min-w-16"
      >
        <span className={`grid size-12 place-items-center rounded-full transition sm:size-14 ${
          open ? "bg-white/25 ring-1 ring-white/30" : "bg-white/10 group-hover:bg-white/18"
        }`}>
          <Send className="size-6" />
        </span>
        <span className="text-[11px] font-black sm:text-xs">
          {count > 0 ? formatCount(count) : "Share"}
        </span>
      </button>

      {open && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={onToggle}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/90 p-6 shadow-2xl backdrop-blur-2xl transition-all scale-in animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onToggle}
              className="absolute right-4 top-4 rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition"
            >
              <X className="size-5" />
            </button>

            {/* Title / Header */}
            <h3 className="text-xl font-black text-white mb-5">Share this game</h3>

            {/* Game Card Context */}
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 overflow-hidden text-3xl shadow-inner select-none">
                {templateThumbnails[template.id] ? (
                  <img src={templateThumbnails[template.id]} alt={template.name} className="size-full object-cover" />
                ) : (
                  templateEmoji[template.id] || "🎮"
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="truncate text-base font-black text-white">{template.name}</h4>
                <p className="truncate text-xs font-bold text-white/40 uppercase tracking-wider">{template.category} • HTML5 GAME</p>
              </div>
            </div>

            {/* Social Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {platforms.map((p) => (
                <button
                  key={p.platform}
                  onClick={p.action}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`grid size-12 place-items-center rounded-2xl border transition duration-200 group-hover:scale-105 active:scale-95 ${p.bgClass}`}>
                    {p.icon}
                  </div>
                  <span className="text-[10px] font-black text-white/60 group-hover:text-white transition text-center truncate w-full px-0.5">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Link Copy Field */}
            <div className="border-t border-white/5 pt-5">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Direct Link</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 pl-4">
                <input
                  type="text"
                  readOnly
                  value={url}
                  className="w-full bg-transparent text-sm text-white/80 outline-none select-all font-mono truncate"
                />
                <button
                  onClick={handleCopy}
                  className="rounded-xl bg-white text-black px-4 py-2.5 text-xs font-black hover:bg-white/90 active:scale-95 transition shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Live Toast/Notification inside modal */}
            {toastMessage && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white text-black px-4 py-2 text-xs font-black shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                {toastMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Comments Panel (slide-up drawer)
// ═══════════════════════════════════════════════════════════════════════════

function CommentsPanel({
  open,
  onClose,
  comments,
  loading,
  onAdd,
  onDelete,
  onLoadMore,
  hasMore,
  count,
}: {
  open: boolean;
  onClose: () => void;
  comments: { _id: string; userId: string; username: string; text: string; createdAt: string }[];
  loading: boolean;
  onAdd: (text: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  count: number;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUserId = useRef(localStorage.getItem("kult_anon_uid") ?? "").current;

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      setText("");
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }, [text, submitting, onAdd]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70vh] flex-col rounded-t-3xl border-t border-white/15 bg-[oklch(0.12_0.02_280)] shadow-2xl animate-in slide-in-from-bottom lg:inset-x-auto lg:left-1/2 lg:w-full lg:max-w-[560px] lg:-translate-x-1/2">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">
            Comments
            {count > 0 && (
              <span className="ml-2 text-sm font-semibold text-white/50">({formatCount(count)})</span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-white/40" />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center">
              <MessageCircle className="mx-auto mb-3 size-10 text-white/20" />
              <p className="text-sm font-semibold text-white/40">No comments yet</p>
              <p className="mt-1 text-xs text-white/25">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c._id} className="group flex gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white/12 text-xs font-black text-white/70">
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-white/90">{c.username}</span>
                      <span className="text-[10px] text-white/30">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-white/70 break-words">{c.text}</p>
                  </div>
                  {c.userId === currentUserId && (
                    <button
                      onClick={() => onDelete(c._id)}
                      className="mt-1 hidden shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-white/10 hover:text-red-400 group-hover:block"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={onLoadMore}
                  disabled={loading}
                  className="mx-auto flex items-center gap-2 rounded-full bg-white/8 px-5 py-2 text-xs font-bold text-white/50 transition hover:bg-white/14 hover:text-white/70 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Load more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Add a comment..."
              maxLength={2000}
              className="flex-1 rounded-full border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/12"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:opacity-30"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  Feed Navigation
// ═══════════════════════════════════════════════════════════════════════════

function FeedLink({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <Link
      to="/play/$gameId"
      params={{ gameId: to }}
      aria-label={label}
      title={label}
      className="grid size-16 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/18"
    >
      {icon}
    </Link>
  );
}
