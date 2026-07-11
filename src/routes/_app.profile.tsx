import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/studio/PageHeader";
import { GameCard } from "@/components/studio/GameCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Game } from "@/lib/games-data";
import { templateEmoji, gradientForId, getThumbnailUrl, resolveGameThumbnail } from "@/lib/studio-meta";
import {
  fetchAchievements,
  fetchCreatorStats,
  fetchDailyChallenges,
  fetchFollowing,
  fetchNotifications,
  fetchPointSummary,
  markNotificationsRead,
  updateProfileName,
  type AchievementSummary,
  type CreatorStats,
  type DailyChallenge,
  type NotificationItem,
  type PointSummary,
} from "@/lib/api/social";
import { getCurrentUserId, getCurrentUsername, getWalletAddress, setCurrentUsername } from "@/lib/identity";
import { api } from "@/lib/api";
import { gameTemplates } from "@/lib/templates";
import profileBg from "@/assets/profile-bg.png";
import { useStudioContext } from "@/context/StudioContext";
import {
  Copy,
  Gift,
  Check,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Bookmark,
  Send,
  MessageSquare,
  Repeat2,
  Rocket,
  Gamepad2,
  Loader2,
  Lock,
  Star,
  Trophy,
  BadgeCheck,
  Bell,
  Target,
  Pencil,
  Shield,
  TrendingUp,
  X,
  Users,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  fetchUserActivities,
  fetchUserFavorites,
  fetchUserLikes,
  type UserActivity,
} from "@/lib/api/social";
import { fetchReferralSummary, type ReferralSummary } from "@/lib/api/referral";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Creator Studio" },
      { name: "description", content: "Your creator profile, stats, and published games." },
    ],
  }),
  component: Profile,
});

const activityIcons: Record<string, any> = {
  like: Heart,
  favorite: Bookmark,
  share: Send,
  comment: MessageSquare,
  create: Rocket,
  play: Gamepad2,
};

const activityColors: Record<string, string> = {
  like: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  favorite: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  share: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  comment: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  create: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  play: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
};

const achievementIconForTitle = (title: string) => {
  const normalized = title.toLowerCase();
  if (normalized.includes("publish")) return Rocket;
  if (normalized.includes("spark") || normalized.includes("like")) return Heart;
  if (normalized.includes("play")) return Gamepad2;
  if (normalized.includes("rising") || normalized.includes("creator score")) return TrendingUp;
  if (normalized.includes("kp")) return BadgeCheck;
  if (normalized.includes("genesis") || normalized.includes("founder")) return Shield;
  return Star;
};

const achievementIconStyleForTitle = (title: string, unlocked: boolean) => {
  const normalized = title.toLowerCase();
  if (!unlocked) {
    if (normalized.includes("play")) {
      return {
        shell: "border-violet-300/35 bg-[radial-gradient(circle_at_35%_25%,#5b4bb2,#1b0a45_72%)]",
        icon: "text-violet-200",
      };
    }
    if (normalized.includes("rising") || normalized.includes("creator score")) {
      return {
        shell: "border-violet-300/35 bg-[radial-gradient(circle_at_35%_25%,#4c2d82,#12062e_72%)]",
        icon: "text-amber-300",
      };
    }
    if (normalized.includes("genesis") || normalized.includes("founder")) {
      return {
        shell: "border-violet-300/35 bg-[radial-gradient(circle_at_35%_25%,#47206f,#12062e_72%)]",
        icon: "text-yellow-300",
      };
    }
    return {
      shell: "border-violet-300/35 bg-[radial-gradient(circle_at_35%_25%,#4c1d95,#12062e_72%)]",
      icon: "text-violet-200",
    };
  }
  if (normalized.includes("publish")) {
    return {
      shell: "border-white/80 bg-[radial-gradient(circle_at_35%_25%,#ffffff,#a78bfa_34%,#7c3aed_72%)]",
      icon: "fill-white text-sky-300",
    };
  }
  if (normalized.includes("spark") || normalized.includes("like")) {
    return {
      shell: "border-white/80 bg-[radial-gradient(circle_at_35%_25%,#ffd6ff,#ec4899_44%,#7e22ce_78%)]",
      icon: "fill-pink-300 text-pink-200",
    };
  }
  if (normalized.includes("kp")) {
    return {
      shell: "border-white/80 bg-[radial-gradient(circle_at_35%_25%,#fef3c7,#c084fc_40%,#7e22ce_78%)]",
      icon: "fill-yellow-200 text-yellow-100",
    };
  }
  return {
    shell: "border-white/80 bg-[radial-gradient(circle_at_35%_25%,#ffffff,#c084fc_38%,#7e22ce_78%)]",
    icon: "fill-white/20 text-white",
  };
};

const achievementLockedLabel = (title: string) => {
  const normalized = title.toLowerCase();
  if (normalized.includes("play")) return "0 / 100";
  if (normalized.includes("rising") || normalized.includes("creator score")) return "0 / 500";
  if (normalized.includes("genesis") || normalized.includes("founder")) return "Not earned";
  return "Locked";
};

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface GameRowProps {
  title: string;
  games: Game[];
  emptyMessage: React.ReactNode;
  /** Adds an edit (pencil) button to each card — used by My Games only. */
  onEditGame?: (game: Game) => void;
}

function GameRow({ title, games, emptyMessage, onEditGame }: GameRowProps) {
  const [showAll, setShowAll] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    loop: false,
    containScroll: "trimSnaps",
    skipSnaps: true,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const viewport = emblaApi.rootNode();
    const handleWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 2) return;
      viewport.scrollLeft += delta;
      event.preventDefault();
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [emblaApi]);

  return (
    <div className="mt-10">
      <div className="relative flex items-center justify-between overflow-hidden rounded-[1.35rem] border-2 border-fuchsia-200 bg-[linear-gradient(145deg,#1c0846,#0b0224)] px-4 py-3 shadow-[0_0_30px_rgba(217,70,239,0.65),inset_0_1px_16px_rgba(255,255,255,0.14)] backdrop-blur-sm sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-none">
        <h2 className="font-display text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(76,29,149,0.45)] sm:text-foreground sm:drop-shadow-none">{title}</h2>
        {games.length > 0 && (
          <div className="flex items-center gap-2">
            {!showAll && (
              <div className="flex items-center gap-1">
                <button
                  onClick={scrollPrev}
                  title={`Previous ${title}`}
                  className="grid size-8 place-items-center rounded-lg border border-white/25 bg-white/15 text-white transition hover:border-fuchsia-300/80 hover:text-white active:scale-95 sm:border-border/60 sm:bg-transparent sm:text-muted-foreground sm:hover:border-primary/50 sm:hover:text-primary"
                >
                  <ChevronLeft className="size-4.5" />
                </button>
                <button
                  onClick={scrollNext}
                  title={`Next ${title}`}
                  className="grid size-8 place-items-center rounded-lg border border-white/25 bg-white/15 text-white transition hover:border-fuchsia-300/80 hover:text-white active:scale-95 sm:border-border/60 sm:bg-transparent sm:text-muted-foreground sm:hover:border-primary/50 sm:hover:text-primary"
                >
                  <ChevronRight className="size-4.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowAll(!showAll)}
              className="ml-2 flex items-center gap-1 rounded-lg border border-violet-700/35 bg-violet-950/20 px-3 py-1.5 text-xs font-bold text-fuchsia-400 shadow-[0_2px_10px_rgba(76,29,149,0.16)] transition hover:border-fuchsia-400/70 hover:bg-violet-950/30 sm:border-border/60 sm:bg-secondary/30 sm:text-primary sm:shadow-none sm:hover:bg-secondary/60 sm:hover:text-primary-foreground"
            >
              {showAll ? "Show less" : "View all"} <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {games.length > 0 ? (
        showAll ? (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {games.map((g, i) => (
              <GameCard key={g.title + i} game={g} index={i} onEdit={onEditGame} />
            ))}
          </div>
        ) : (
          <div ref={emblaRef} className="mt-5 cursor-grab overflow-hidden select-none active:cursor-grabbing">
            <div className="flex touch-pan-y gap-4">
              {games.map((g, i) => (
                <div key={g.title + i} className="flex-[0_0_240px] sm:flex-[0_0_280px] min-w-0">
                  <GameCard game={g} index={i} onEdit={onEditGame} />
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

type TimeFilter = "today" | "week" | "month" | "all";

function Profile() {
  const navigate = useNavigate();
  const { createdGames } = useStudioContext();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  // Real info (title, cover, views) for any game referenced by likes,
  // favorites, or history — fetched from the backend, never guessed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameInfo, setGameInfo] = useState<Record<string, any>>({});
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [likedGames, setLikedGames] = useState<Game[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [mobileGameTab, setMobileGameTab] = useState("My Games");
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [referral, setReferral] = useState<ReferralSummary | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [achievementSummary, setAchievementSummary] = useState<AchievementSummary | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [openPanel, setOpenPanel] = useState<"challenges" | "achievements" | "notifications" | null>(null);
  const [followingCount, setFollowingCount] = useState(0);
  const [pointSummary, setPointSummary] = useState<PointSummary | null>(null);
  const [displayName, setDisplayName] = useState(() => getCurrentUsername());
  const [draftDisplayName, setDraftDisplayName] = useState(displayName);
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [identityCopied, setIdentityCopied] = useState(false);

  const getThumbnail = useCallback((id: string | undefined, fallbackUrl?: string) => {
    if (!id) return fallbackUrl;
    return getThumbnailUrl(id);
  }, []);

  const formatViews = (views: number | undefined): string => {
    if (!views) return "—";
    return views >= 1000 ? `${(views / 1000).toFixed(1)}K` : String(views);
  };

  const mapActivityToGame = useCallback((gameId: string, gameTitle: string): Game => {
    // 1) the user's own creations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customGame = createdGames.find((cg: any) => cg.id === gameId || cg.templateId === gameId);
    if (customGame) {
      return {
        title: customGame.title,
        category: customGame.category ?? "Game",
        plays: formatViews(customGame.views),
        emoji: templateEmoji[customGame.templateId] ?? "🎮",
        gradient: gradientForId(customGame.templateId ?? customGame.id),
        creator: "you",
        thumbnailUrl: resolveGameThumbnail(customGame),
        templateId: customGame.id ?? customGame.templateId,
      };
    }

    // 2) other creators' games — real record fetched from the backend
    const remote = gameInfo[gameId];
    if (remote) {
      return {
        title: remote.title,
        category: remote.category ?? "Game",
        plays: formatViews(remote.views),
        emoji: templateEmoji[remote.templateId] ?? "🎮",
        gradient: gradientForId(remote.templateId ?? remote.id),
        creator: remote.creatorId?.startsWith("0x")
          ? `${remote.creatorId.slice(0, 6)}…${remote.creatorId.slice(-4)}`
          : "community",
        thumbnailUrl: resolveGameThumbnail(remote),
        templateId: remote.id,
      };
    }

    // 3) platform templates (gameId IS the template id)
    const template = gameTemplates.find((t: any) => t.id === gameId);
    if (template) {
      return {
        title: template.name,
        category: template.category ?? "Game",
        plays: "—",
        emoji: templateEmoji[gameId] ?? "🎮",
        gradient: gradientForId(gameId),
        creator: "studio",
        thumbnailUrl: getThumbnail(gameId),
        templateId: gameId,
      };
    }

    // 4) deleted/unknown game — show only what was truthfully recorded
    return {
      title: gameTitle || "Removed game",
      category: "Game",
      plays: "—",
      emoji: "🎮",
      gradient: gradientForId(gameId),
      creator: "—",
      thumbnailUrl: getThumbnail(gameId),
      templateId: gameId,
    };
  }, [createdGames, gameInfo, getThumbnail]);

  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const uid = getCurrentUserId();

    Promise.allSettled([
      fetchUserActivities(uid).then((data) => setActivities(data ?? [])),
      fetchUserFavorites(uid).then((data) => {
        if (data && Array.isArray(data.favorites)) setFavoriteIds(data.favorites.map((f) => f.gameId));
      }),
      fetchUserLikes(uid).then((data) => {
        if (data && Array.isArray(data.likes)) setLikedIds(data.likes.map((l) => l.gameId));
      }),
    ]).finally(() => setActivitiesLoading(false));
  }, []);

  // Resolve REAL records for every game referenced by likes/favorites/history.
  useEffect(() => {
    const referenced = new Set<string>([...likedIds, ...favoriteIds]);
    for (const act of activities) {
      if (act.gameId) referenced.add(act.gameId);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const known = new Set<string>([
      ...createdGames.map((g: any) => g?.id),
      ...gameTemplates.map((t: any) => t.id),
    ]);
    const missing = [...referenced].filter((id) => id && !known.has(id));
    if (missing.length === 0) return;
    api
      .get("/games/list", { params: { ids: missing.join(","), limit: 100 } })
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map: Record<string, any> = {};
        for (const g of res.data?.games ?? []) map[g.id] = g;
        setGameInfo(map);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [likedIds, favoriteIds, activities]);

  useEffect(() => {
    setLikedGames(likedIds.map((id) => mapActivityToGame(id, "")));
    setFavoriteGames(favoriteIds.map((id) => mapActivityToGame(id, "")));
  }, [likedIds, favoriteIds, mapActivityToGame]);

  const games: Game[] = createdGames
    .filter((g: any, i: number, all: any[]) => !g?.id || all.findIndex((x: any) => x?.id === g.id) === i)
    .map((g: any) => ({
      title: g.title,
      category: g.category ?? "Game",
      plays: g.views ? (g.views >= 1000 ? `${(g.views / 1000).toFixed(1)}K` : String(g.views)) : "New",
      emoji: templateEmoji[g.templateId] ?? "🎮",
      gradient: gradientForId(g.templateId ?? g.id),
      creator: "you",
      thumbnailUrl: resolveGameThumbnail(g),
      templateId: g.id ?? g.templateId,
    }));

  // Extract history games (played or created) from activities
  const historyGamesMap = new Map<string, string>();
  activities.forEach((act) => {
    if (act.gameId && (act.activityType === "play" || act.activityType === "create")) {
      if (!historyGamesMap.has(act.gameId)) {
        historyGamesMap.set(act.gameId, act.gameTitle || "");
      }
    }
  });
  const historyGames: Game[] = Array.from(historyGamesMap.entries()).map(([gameId, title]) =>
    mapActivityToGame(gameId, title)
  );
  const profileGameSections = [
    {
      title: "My Games",
      games,
      emptyMessage: (
        <>
          No games yet. Head to <span className="text-primary font-bold">Create</span> to generate your first playable build.
        </>
      ),
      onEditGame: (g: Game) => {
        if (g.templateId) navigate({ to: "/edit/$gameId", params: { gameId: g.templateId } });
      },
    },
    {
      title: "History",
      games: historyGames,
      emptyMessage: "No games in history. Play or generate games to see them listed here.",
    },
    {
      title: "Favorites",
      games: favoriteGames,
      emptyMessage: "No favorite games yet. Click the bookmark icon on any game to favorite it.",
    },
    {
      title: "Liked Games",
      games: likedGames,
      emptyMessage: "No liked games yet. Click the heart icon on any game to like it.",
    },
  ];
  const selectedMobileGameSection =
    profileGameSections.find((section) => section.title === mobileGameTab) ?? profileGameSections[0];

  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  useEffect(() => {
    const userId = getCurrentUserId();
    fetchCreatorStats(userId).then(setCreatorStats).catch(() => {});
    fetchFollowing(userId).then((data) => setFollowingCount(data.following?.length ?? 0)).catch(() => {});
    fetchPointSummary(userId).then(setPointSummary).catch(() => {});
    fetchDailyChallenges(userId).then((data) => setDailyChallenges(data.challenges)).catch(() => {});
    fetchAchievements(userId).then(setAchievementSummary).catch(() => {});
    fetchNotifications(userId).then((data) => setNotifications(data.notifications)).catch(() => {});
    fetchReferralSummary().then(setReferral).catch(() => {});
  }, []);

  const formatStat = (value: number | undefined) => {
    const n = value ?? 0;
    return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  };
  const formatKultPoints = (value: number | undefined) => {
    const n = value ?? 0;
    const compact = (divisor: number, suffix: string) => {
      const scaled = n / divisor;
      const fixed = scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2);
      return `${fixed.replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1")}${suffix}`;
    };
    if (n >= 1_000_000_000) return compact(1_000_000_000, "b");
    if (n >= 1_000_000) return compact(1_000_000, "m");
    if (n >= 1_000) return compact(1_000, "k");
    return String(n);
  };
  const userId = getCurrentUserId();
  const wallet = getWalletAddress();
  const identityLine = wallet ?? userId;
  const compactIdentity =
    identityLine.length > 14 ? `${identityLine.slice(0, 6)}...${identityLine.slice(-4)}` : identityLine;
  // Joined date from the earliest real record we have (creation or activity).
  const timestamps: number[] = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...createdGames.map((g: any) => new Date(g?.createdAt ?? NaN).getTime()),
    ...activities.map((a) => new Date(a.timestamp).getTime()),
  ].filter((t) => Number.isFinite(t));
  const joined =
    timestamps.length > 0
      ? new Date(Math.min(...timestamps)).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  const todayPoints = creatorStats?.currentDay
    ? creatorStats.dailyScore?.[creatorStats.currentDay] ?? creatorStats.dailyPoints?.[creatorStats.currentDay] ?? 0
    : 0;
  const weekPoints = creatorStats?.currentWeek
    ? creatorStats.weeklyScore?.[creatorStats.currentWeek] ?? creatorStats.weeklyPoints?.[creatorStats.currentWeek] ?? 0
    : 0;

  const saveDisplayName = () => {
    const savedName = setCurrentUsername(draftDisplayName);
    setDisplayName(savedName);
    setDraftDisplayName(savedName);
    setEditingDisplayName(false);
    // Persist server-side so leaderboards and other users see the new name.
    void updateProfileName(getCurrentUserId(), savedName).catch(() => {});
  };

  const cancelDisplayNameEdit = () => {
    setDraftDisplayName(displayName);
    setEditingDisplayName(false);
  };

  const copyIdentity = async () => {
    try {
      await navigator.clipboard.writeText(identityLine);
      setIdentityCopied(true);
      window.setTimeout(() => setIdentityCopied(false), 1200);
    } catch {
      setIdentityCopied(false);
    }
  };

  const openNotificationsPanel = () => {
    setOpenPanel("notifications");
    void markNotificationsRead(getCurrentUserId()).then(() => {
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    }).catch(() => null);
  };

  const filteredActivities = activities.filter((activity) => {
    const actDate = new Date(activity.timestamp);
    const now = new Date();
    
    if (timeFilter === "today") {
      return actDate.toDateString() === now.toDateString();
    }
    
    const diffTime = now.getTime() - actDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (timeFilter === "week") {
      return diffDays <= 7;
    }
    if (timeFilter === "month") {
      return diffDays <= 30;
    }
    return true;
  });

  return (
    <div className="relative min-h-screen overflow-hidden sm:min-h-0">
      <img
        src={profileBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-top sm:hidden"
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_6%,rgba(255,255,255,0.62),transparent_26%),radial-gradient(circle_at_16%_38%,rgba(244,114,182,0.24),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.24),rgba(216,180,254,0.2))] sm:hidden" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_42%,transparent_62%)] opacity-70 sm:hidden" />
      <div className="relative z-10 hidden sm:block">
        <PageHeader title="Profile" subtitle="Your creator identity · Published games" />
      </div>
      <div className="relative z-10 px-4 pb-8 pt-3 sm:px-6 sm:py-8 lg:px-10">
        <div className="relative mb-5 flex items-center justify-between overflow-hidden rounded-[1.55rem] border-2 border-fuchsia-200 bg-[#100528] px-4 py-3 shadow-[0_6px_0_rgba(65,24,138,0.75),0_0_34px_rgba(217,70,239,0.9),inset_0_1px_18px_rgba(255,255,255,0.16)] sm:hidden">
          <div className="font-display text-2xl font-black leading-none text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
            KULT
            <span className="block text-[0.62rem] tracking-[0.24em]">GAMES</span>
          </div>
          <h1 className="font-display text-3xl font-black text-white">Profile</h1>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            title="Home"
            className="grid size-12 place-items-center rounded-2xl border border-white/30 bg-[linear-gradient(145deg,#b26cff,#6627d8)] text-white shadow-[inset_0_2px_8px_rgba(255,255,255,0.42),0_0_18px_rgba(178,108,255,0.8)]"
          >
            <Home className="size-7 fill-none stroke-[3.2] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]" />
          </button>
        </div>

        <div className="space-y-4 sm:hidden">
          <section className="relative overflow-hidden rounded-[2rem] border-2 border-fuchsia-200 bg-[linear-gradient(145deg,#1b0744,#09011c)] p-5 text-white shadow-[0_0_0_4px_rgba(217,70,239,0.32),0_0_34px_rgba(217,70,239,0.7),0_14px_30px_rgba(91,33,182,0.38),inset_0_1px_20px_rgba(255,255,255,0.14)]">
            <div className="pointer-events-none absolute -left-16 top-0 h-28 w-44 rotate-[-18deg] bg-white/10 blur-2xl" />
            <div className="absolute -right-8 -bottom-8 size-36 rounded-full bg-fuchsia-300/35 blur-xl" />
            <div className="relative flex items-center gap-5">
              <div className="grid size-28 shrink-0 place-items-center rounded-full border-[6px] border-fuchsia-300 bg-[radial-gradient(circle,#3e196f,#16072f_70%)] text-6xl shadow-[0_0_22px_rgba(245,132,255,0.9)]">
                🎮
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  {editingDisplayName ? (
                    <input
                      value={draftDisplayName}
                      onChange={(event) => setDraftDisplayName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveDisplayName();
                        if (event.key === "Escape") cancelDisplayNameEdit();
                      }}
                      autoFocus
                      maxLength={32}
                      className="min-w-0 flex-1 rounded-xl border border-fuchsia-300/70 bg-[#24104d]/80 px-3 py-1.5 font-display text-2xl font-black text-white outline-none"
                    />
                  ) : (
                    <h2 className="truncate font-display text-3xl font-black text-white">{displayName}</h2>
                  )}
                  <BadgeCheck className="size-6 shrink-0 fill-fuchsia-400 text-[#14062e]" />
                  {editingDisplayName ? (
                    <>
                      <button
                        type="button"
                        onClick={saveDisplayName}
                        title="Save name"
                        className="grid size-8 shrink-0 place-items-center rounded-lg border border-fuchsia-300/50 bg-fuchsia-400/20 text-fuchsia-100"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={cancelDisplayNameEdit}
                        title="Cancel name edit"
                        className="grid size-8 shrink-0 place-items-center rounded-lg border border-violet-200/30 bg-white/10 text-violet-100"
                      >
                        <X className="size-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftDisplayName(displayName);
                        setEditingDisplayName(true);
                      }}
                      title="Edit name"
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-fuchsia-300/40 bg-white/10 text-fuchsia-200"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={copyIdentity}
                  className="mt-3 flex max-w-full items-center gap-2 text-left font-display text-sm font-black text-violet-200"
                >
                  <span className="truncate">{compactIdentity}</span>
                  {identityCopied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
                </button>
                <p className="mt-2 text-sm font-black text-violet-100">
                  Joined {joined ?? "11 June 2026"}
                </p>
                {achievementSummary?.inventory.genesisFounderBadge && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-yellow-300/75 bg-[#21110b] px-4 py-2 font-display text-xs font-black text-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.36)]">
                    <BadgeCheck className="size-4 fill-yellow-300 text-[#21110b]" /> Genesis Founder
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[1.45rem] border-2 border-yellow-200 bg-[linear-gradient(145deg,#2b170c,#140705)] px-6 py-5 shadow-[0_8px_20px_rgba(92,53,8,0.28),0_0_30px_rgba(250,204,21,0.52),inset_0_1px_18px_rgba(255,255,255,0.14)]">
            <Star className="absolute right-36 top-6 size-7 fill-yellow-400/10 text-yellow-300/15" />
            <Star className="absolute right-24 top-16 size-5 fill-yellow-400/10 text-yellow-300/25" />
            <Star className="absolute right-5 top-5 size-4 fill-yellow-300 text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            <Star className="absolute right-28 bottom-8 size-4 fill-yellow-300 text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            <Trophy className="absolute right-7 top-1/2 size-16 -translate-y-1/2 text-yellow-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.9)]" />
            <p className="font-display text-sm font-black tracking-[0.22em] text-yellow-200">CREATOR SCORE</p>
            <p className="mt-2 font-display text-6xl font-black leading-none text-yellow-300">
              {formatStat(creatorStats?.lifetimeScore ?? creatorStats?.creatorScore)}
            </p>
          </section>

          <section className="relative overflow-hidden rounded-[1.45rem] border-2 border-fuchsia-200 bg-[linear-gradient(145deg,#1a0646,#0b0224)] px-6 py-5 shadow-[0_8px_20px_rgba(91,33,182,0.3),0_0_34px_rgba(217,70,239,0.72),inset_0_1px_18px_rgba(255,255,255,0.15)]">
            <Star className="absolute right-36 top-7 size-3.5 fill-fuchsia-300 text-fuchsia-200 drop-shadow-[0_0_8px_rgba(245,132,255,0.85)]" />
            <Star className="absolute right-5 top-6 size-4 fill-fuchsia-300 text-fuchsia-200 drop-shadow-[0_0_8px_rgba(245,132,255,0.85)]" />
            <Star className="absolute right-40 bottom-8 size-4 fill-fuchsia-300 text-fuchsia-200 drop-shadow-[0_0_8px_rgba(245,132,255,0.85)]" />
            <Star className="absolute right-7 bottom-5 size-3.5 fill-fuchsia-300 text-fuchsia-200 drop-shadow-[0_0_8px_rgba(245,132,255,0.85)]" />
            <div className="absolute right-6 top-1/2 grid size-20 -translate-y-1/2 place-items-center rounded-full border-4 border-fuchsia-200 bg-fuchsia-400 font-display text-2xl font-black text-white shadow-[0_0_20px_rgba(245,132,255,0.95)]">
              KP
            </div>
            <p className="font-display text-sm font-black tracking-[0.22em] text-fuchsia-300">KULT POINTS (KP)</p>
            <p className="mt-3 max-w-[74%] truncate font-display text-5xl font-black leading-none text-fuchsia-300 min-[420px]:text-6xl">
              {formatKultPoints(pointSummary?.kultPoints ?? pointSummary?.lifetimePoints)}
            </p>
            <p className="mt-2 font-display text-sm font-black tracking-[0.28em] text-fuchsia-200">
              LEVEL {pointSummary?.level?.level ?? 1}
            </p>
          </section>

          <section className="grid grid-cols-3 overflow-hidden rounded-[1.35rem] border-2 border-violet-200 bg-[linear-gradient(145deg,#1c0846,#0b0224)] text-center text-white shadow-[0_0_28px_rgba(124,58,237,0.65),inset_0_1px_16px_rgba(255,255,255,0.13)]">
            {[
              [<Gamepad2 className="size-9 text-violet-300" />, formatStat(createdGames.length), "Games"],
              [<Users className="size-9 text-fuchsia-300" />, formatStat(creatorStats?.followers), "Followers"],
              [<Users className="size-9 text-blue-300" />, formatStat(followingCount), "Following"],
            ].map(([icon, value, label], index) => (
              <div key={String(label)} className={`flex items-center justify-center gap-3 px-3 py-4 ${index > 0 ? "border-l border-violet-300/30" : ""}`}>
                {icon}
                <div>
                  <p className="font-display text-3xl font-black leading-none">{value}</p>
                  <p className="text-xs font-bold text-violet-100">{label}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-3 gap-2 text-center text-white">
            {[
              [<Heart className="size-8 fill-pink-400 text-pink-300" />, formatStat(creatorStats?.likes), "Likes"],
              [<Send className="size-8 fill-teal-300 text-teal-200" />, formatStat(creatorStats?.shares), "Shares"],
              [<Repeat2 className="size-8 text-blue-300" />, formatStat(creatorStats?.remixes), "Remixes"],
            ].map(([icon, value, label]) => (
              <div key={String(label)} className="rounded-[1.25rem] border-2 border-violet-200/90 bg-[linear-gradient(145deg,#1c0846,#0b0224)] px-3 py-4 shadow-[0_0_24px_rgba(124,58,237,0.58),inset_0_1px_14px_rgba(255,255,255,0.12)]">
                <div className="flex items-center justify-center gap-3">
                  {icon}
                  <p className="font-display text-3xl font-black leading-none">{value}</p>
                </div>
                <p className="mt-1 text-xs font-bold text-violet-100">{label}</p>
              </div>
            ))}
          </section>

          <button
            type="button"
            onClick={() => setOpenPanel("challenges")}
            className="relative flex w-full items-center justify-between overflow-hidden rounded-[1.55rem] border-2 border-fuchsia-200 bg-[linear-gradient(145deg,#1c0846,#0b0224)] p-5 text-left text-white shadow-[0_0_34px_rgba(217,70,239,0.72),inset_0_1px_18px_rgba(255,255,255,0.15)]"
          >
            <CalendarDays className="size-20 text-violet-300 drop-shadow-[0_0_14px_rgba(196,181,253,0.9)]" />
            <span className="min-w-0 flex-1 px-4">
              <span className="block font-display text-2xl font-black">Daily Challenges</span>
              <span className="mt-1 block text-sm font-bold text-violet-100">
                {dailyChallenges.filter((c) => c.completed).length}/{dailyChallenges.length} complete
              </span>
              <span className="mt-3 block h-4 overflow-hidden rounded-full border border-fuchsia-300/70 bg-[#2a1155]">
                <span
                  className="block h-full rounded-full bg-[linear-gradient(90deg,#e879f9,#a855f7)]"
                  style={{ width: `${dailyChallenges.length ? (dailyChallenges.filter((c) => c.completed).length / dailyChallenges.length) * 100 : 0}%` }}
                />
              </span>
            </span>
            <Gift className="size-20 text-fuchsia-300 drop-shadow-[0_0_14px_rgba(245,132,255,0.9)]" />
            <Star className="absolute right-24 top-9 size-6 fill-yellow-300 text-yellow-300" />
          </button>

          <button
            type="button"
            onClick={() => setOpenPanel("achievements")}
            className="relative flex w-full items-center justify-between overflow-hidden rounded-[1.55rem] border-2 border-fuchsia-200 bg-[linear-gradient(145deg,#1c0846,#0b0224)] p-5 text-left text-white shadow-[0_0_34px_rgba(217,70,239,0.72),inset_0_1px_18px_rgba(255,255,255,0.15)]"
          >
            <span className="relative grid size-20 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle,#ffe772_0%,#f5b914_48%,#7c3a12_100%)] shadow-[0_0_22px_rgba(250,204,21,0.75),inset_0_3px_10px_rgba(255,255,255,0.55)]">
              <Trophy className="size-12 fill-yellow-200 text-yellow-950 drop-shadow-[0_2px_0_rgba(255,255,255,0.28)]" />
              <span className="absolute left-4 top-3 size-3 rounded-full bg-white/70 blur-[1px]" />
              <span className="absolute -bottom-1 h-2 w-12 rounded-full bg-yellow-300/70 blur-[2px]" />
            </span>
            <span className="min-w-0 flex-1 px-4">
              <span className="block font-display text-2xl font-black">Achievements</span>
              <span className="mt-1 block text-sm font-bold text-violet-100">
                {achievementSummary?.inventory.badges.length ?? 0} unlocked
              </span>
            </span>
            <Star className="absolute right-24 top-8 size-5 fill-yellow-300 text-yellow-300" />
            <Star className="absolute right-7 bottom-6 size-4 fill-fuchsia-300 text-fuchsia-200" />
          </button>
        </div>

        <div className="animate-float-up relative hidden overflow-hidden rounded-3xl border border-border/60 bg-[radial-gradient(circle_at_18%_10%,oklch(0.72_0.25_315/0.22),transparent_32%),radial-gradient(circle_at_88%_12%,oklch(0.82_0.16_195/0.16),transparent_30%),linear-gradient(145deg,oklch(0.08_0.02_282),oklch(0.045_0.014_282))] p-5 shadow-[0_24px_80px_oklch(0_0_0/0.45)] sm:block sm:p-6">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
          <div className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full border border-primary/15 bg-primary/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 size-52 rounded-full border border-cyan-300/10 bg-cyan-300/5 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto grid size-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_160deg,oklch(0.72_0.25_315),oklch(0.82_0.16_195),oklch(0.85_0.18_80),oklch(0.72_0.25_315))] p-1 shadow-[0_0_34px_oklch(0.72_0.25_315/0.36)] sm:mx-0">
              <div className="grid size-full place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,oklch(0.24_0.05_300),oklch(0.07_0.018_282)_68%)] text-5xl">
                🎮
              </div>
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {editingDisplayName ? (
                  <input
                    value={draftDisplayName}
                    onChange={(event) => setDraftDisplayName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveDisplayName();
                      if (event.key === "Escape") cancelDisplayNameEdit();
                    }}
                    autoFocus
                    maxLength={32}
                    className="min-w-0 rounded-xl border border-primary/40 bg-background/70 px-3 py-1.5 text-center font-display text-2xl font-black text-foreground outline-none focus:border-primary sm:text-left sm:text-3xl"
                  />
                ) : (
                  <h2 className="max-w-full truncate font-display text-3xl font-black leading-none text-foreground sm:text-4xl">
                    {displayName}
                  </h2>
                )}
                <BadgeCheck className="size-6 shrink-0 fill-primary text-background drop-shadow-[0_0_10px_oklch(0.72_0.25_315/0.55)]" />
                {editingDisplayName ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={saveDisplayName}
                      title="Save name"
                      className="grid size-8 place-items-center rounded-lg border border-primary/40 bg-primary/15 text-primary transition hover:bg-primary/25"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelDisplayNameEdit}
                      title="Cancel name edit"
                      className="grid size-8 place-items-center rounded-lg border border-border/60 bg-background/40 text-muted-foreground transition hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftDisplayName(displayName);
                      setEditingDisplayName(true);
                    }}
                    title="Edit name"
                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/60 bg-background/35 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                  >
                    <Pencil className="size-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 flex min-w-0 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground sm:justify-start">
                <button
                  type="button"
                  onClick={copyIdentity}
                  title="Copy wallet address"
                  className="flex min-w-0 items-center gap-2 rounded-full border border-border/50 bg-background/35 px-3 py-1.5 text-left transition hover:border-primary/50 hover:text-primary"
                >
                  <span className="truncate font-mono">{compactIdentity}</span>
                  {identityCopied ? <Check className="size-3.5 shrink-0" /> : <Copy className="size-3.5 shrink-0" />}
                </button>
              </div>
              {joined && (
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  Joined {joined}
                </p>
              )}
              {achievementSummary?.inventory.genesisFounderBadge && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/45 bg-amber-300/10 px-4 py-2 text-xs font-black text-amber-200 shadow-[0_0_22px_oklch(0.85_0.18_80/0.18)]">
                  <BadgeCheck className="size-4 fill-amber-400/30 text-amber-300" /> Genesis Founder
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-amber-300/25 bg-[linear-gradient(135deg,oklch(0.22_0.07_80/0.62),oklch(0.08_0.02_282/0.84))] px-5 py-4 shadow-[inset_0_0_24px_oklch(0.82_0.18_80/0.1),0_0_24px_oklch(0.82_0.18_80/0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="label-mono text-[0.68rem] font-black leading-none text-amber-200">CREATOR SCORE</p>
                  <p className="mt-2 font-display text-4xl font-black leading-none text-amber-300">
                    {formatStat(creatorStats?.lifetimeScore ?? creatorStats?.creatorScore)}
                  </p>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-amber-300/20 text-amber-200 shadow-[0_0_20px_oklch(0.82_0.18_80/0.32)]">
                  <Trophy className="size-5" />
                </span>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-primary/25 bg-[linear-gradient(135deg,oklch(0.22_0.08_315/0.54),oklch(0.08_0.02_282/0.88))] px-5 py-4 shadow-[inset_0_0_24px_oklch(0.7_0.24_295/0.1),0_0_24px_oklch(0.7_0.24_295/0.1)]">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="label-mono text-[0.68rem] font-black leading-none text-primary">KULT POINTS (KP)</p>
                  <p className="mt-2 font-display text-4xl font-black leading-none text-primary">
                    {formatKultPoints(pointSummary?.kultPoints ?? pointSummary?.lifetimePoints)}
                  </p>
                  <p className="mt-1 label-mono text-[0.62rem] font-bold text-primary/75">
                    Level {pointSummary?.level?.level ?? 1}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-border/45 bg-background/25 p-3">
              <p className="font-display text-3xl font-black text-foreground">{formatStat(createdGames.length)}</p>
              <p className="mt-1 text-sm font-bold text-muted-foreground">Games</p>
            </div>
            <div className="rounded-2xl border border-border/45 bg-background/25 p-3">
              <p className="font-display text-3xl font-black text-foreground">{formatStat(creatorStats?.followers)}</p>
              <p className="mt-1 text-sm font-bold text-muted-foreground">Followers</p>
            </div>
            <div className="rounded-2xl border border-border/45 bg-background/25 p-3">
              <p className="font-display text-3xl font-black text-foreground">{formatStat(followingCount)}</p>
              <p className="mt-1 text-sm font-bold text-muted-foreground">Following</p>
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-border/55 bg-background/35 p-3 transition hover:border-primary/35 hover:bg-primary/5">
              <p className="font-display text-2xl font-black">{formatStat(creatorStats?.likes)}</p>
              <p className="label-mono mt-1 text-[9px] text-muted-foreground">LIKES</p>
            </div>
            <div className="rounded-2xl border border-border/55 bg-background/35 p-3 transition hover:border-primary/35 hover:bg-primary/5">
              <p className="font-display text-2xl font-black">{formatStat(creatorStats?.shares)}</p>
              <p className="label-mono mt-1 text-[9px] text-muted-foreground">SHARES</p>
            </div>
            <div className="rounded-2xl border border-border/55 bg-background/35 p-3 transition hover:border-primary/35 hover:bg-primary/5">
              <p className="font-display text-2xl font-black">{formatStat(creatorStats?.remixes)}</p>
              <p className="label-mono mt-1 text-[9px] text-muted-foreground">REMIXES</p>
            </div>
          </div>
        </div>

        <div className="mt-8 hidden gap-3 sm:grid sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setOpenPanel("challenges")}
            className="flex min-h-24 items-center gap-4 rounded-xl border border-border/60 bg-card/55 p-5 text-left transition hover:border-primary/50 hover:bg-card"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <Target className="size-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-black">Daily Challenges</span>
              <span className="mt-1 block text-xs text-muted-foreground">{dailyChallenges.filter((c) => c.completed).length}/{dailyChallenges.length} complete</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOpenPanel("achievements")}
            className="flex min-h-24 items-center gap-4 rounded-xl border border-border/60 bg-card/55 p-5 text-left transition hover:border-primary/50 hover:bg-card"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <Trophy className="size-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-black">Achievements</span>
              <span className="mt-1 block text-xs text-muted-foreground">{achievementSummary?.inventory.badges.length ?? 0} unlocked</span>
            </span>
          </button>
          <button
            type="button"
            onClick={openNotificationsPanel}
            className="flex min-h-24 items-center gap-4 rounded-xl border border-border/60 bg-card/55 p-5 text-left transition hover:border-primary/50 hover:bg-card"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <Bell className="size-5" />
            </span>
            <span>
              <span className="block font-display text-lg font-black">Notifications</span>
              <span className="mt-1 block text-xs text-muted-foreground">{notifications.filter((n) => !n.read).length} unread</span>
            </span>
          </button>
        </div>

        <Dialog open={openPanel === "challenges"} onOpenChange={(open) => !open && setOpenPanel(null)}>
          <DialogContent className="max-h-[90vh] overflow-hidden rounded-[1.9rem] border-2 border-fuchsia-300 bg-[radial-gradient(circle_at_22%_7%,rgba(168,85,247,0.42),transparent_25%),linear-gradient(180deg,#18033f_0%,#080018_100%)] p-4 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.18),0_0_46px_rgba(168,85,247,0.95),inset_0_0_28px_rgba(168,85,247,0.26)] sm:max-w-xl sm:p-6 [&>button]:right-4 [&>button]:top-4 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center [&>button]:rounded-full [&>button]:border-2 [&>button]:border-fuchsia-100 [&>button]:bg-[#2b0b66]/95 [&>button]:text-white [&>button]:opacity-100 [&>button]:shadow-[0_0_18px_rgba(217,70,239,0.95),inset_0_1px_8px_rgba(255,255,255,0.24)] [&>button>svg]:size-6">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-3 pr-12 font-display text-3xl font-black text-white drop-shadow-[0_4px_0_rgba(76,29,149,0.95),0_0_14px_rgba(217,70,239,0.95)] sm:text-4xl">
                <span className="relative grid size-20 shrink-0 place-items-center">
                  <span className="absolute inset-1 rounded-full bg-fuchsia-500/45 blur-xl" />
                  <span className="relative grid size-16 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#fef3c7,#c084fc_48%,rgba(59,7,100,0.1)_82%,transparent)]">
                    <Target className="size-11 fill-yellow-200/20 text-yellow-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.24)]" />
                    <span className="absolute left-5 top-4 size-2 rounded-full bg-white/80 blur-[1px]" />
                  </span>
                  <Star className="absolute right-0 top-2 size-4 fill-yellow-200 text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.95)]" />
                  <Star className="absolute left-0 bottom-3 size-3 fill-fuchsia-200 text-fuchsia-200 drop-shadow-[0_0_8px_rgba(245,208,254,0.85)]" />
                </span>
                Daily Challenges
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[64vh] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(232,121,249,0.75)_transparent]">
              <div className="grid gap-3">
              {dailyChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-4 backdrop-blur-md sm:gap-4 sm:p-4 ${
                    challenge.completed
                      ? "border-fuchsia-100 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.3),transparent_19%),linear-gradient(135deg,#a735ff,#5c16ba)] shadow-[0_0_24px_rgba(217,70,239,0.92),inset_0_1px_20px_rgba(255,255,255,0.3),inset_0_-18px_34px_rgba(76,29,149,0.35)]"
                      : "border-violet-400/45 bg-[linear-gradient(135deg,rgba(21,8,52,0.92),rgba(6,1,24,0.96))] shadow-[0_0_12px_rgba(124,58,237,0.24),inset_0_1px_14px_rgba(255,255,255,0.08)]"
                  }`}
                >
                  {challenge.completed && <Star className="absolute right-5 top-4 size-4 fill-yellow-200 text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />}
                  <span className={`relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border shadow-[inset_0_2px_12px_rgba(255,255,255,0.24),0_3px_10px_rgba(0,0,0,0.2)] sm:size-20 ${
                    challenge.completed
                      ? "border-white/80 bg-[radial-gradient(circle_at_35%_25%,#fef3c7,#a855f7_44%,#7e22ce_78%)]"
                      : "border-violet-300/35 bg-[radial-gradient(circle_at_35%_25%,#4c1d95,#12062e_72%)]"
                  }`}>
                    <span className="absolute left-3 top-2 size-4 rounded-full bg-white/55 blur-[2px]" />
                    <Target className={`relative size-9 drop-shadow-[0_2px_2px_rgba(0,0,0,0.24)] sm:size-11 ${challenge.completed ? "fill-yellow-200/20 text-yellow-100" : "text-violet-300"}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-display text-lg font-black sm:text-xl ${challenge.completed ? "text-white" : "text-violet-100/85"}`}>{challenge.title}</span>
                    <span className={`mt-1 block text-sm font-bold ${challenge.completed ? "text-violet-50/85" : "text-violet-200/65"}`}>{challenge.reward}</span>
                    <span className="mt-3 block h-3 overflow-hidden rounded-full border border-fuchsia-200/35 bg-white/10">
                      <span
                        className="block h-full rounded-full bg-[linear-gradient(90deg,#f0abfc,#a855f7)] shadow-[0_0_10px_rgba(217,70,239,0.7)]"
                        style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                      />
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${
                    challenge.completed
                      ? "border-fuchsia-100/80 bg-fuchsia-400/40 text-white shadow-[0_0_14px_rgba(245,208,254,0.55),inset_0_1px_8px_rgba(255,255,255,0.2)]"
                      : "border-violet-300/30 bg-white/8 text-violet-200"
                  }`}>
                    {challenge.completed ? (
                      <span className="flex items-center gap-1"><Check className="size-3.5" /> Completed</span>
                    ) : (
                      `${challenge.progress} / ${challenge.target}`
                    )}
                  </span>
                </div>
              ))}
              {dailyChallenges.length === 0 && <p className="text-sm text-violet-100">No daily challenges loaded yet.</p>}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-fuchsia-200/40 bg-white/8 px-4 py-3 text-sm font-bold text-violet-100 shadow-[0_0_18px_rgba(217,70,239,0.34),inset_0_1px_10px_rgba(255,255,255,0.12)]">
                <Star className="size-5 fill-fuchsia-300 text-fuchsia-200" />
                Complete challenges. Collect rewards. Keep KULTing!
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={openPanel === "achievements"} onOpenChange={(open) => !open && setOpenPanel(null)}>
          <DialogContent className="max-h-[90vh] overflow-hidden rounded-[1.9rem] border-2 border-fuchsia-300 bg-[radial-gradient(circle_at_22%_7%,rgba(168,85,247,0.42),transparent_25%),linear-gradient(180deg,#18033f_0%,#080018_100%)] p-4 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.18),0_0_46px_rgba(168,85,247,0.95),inset_0_0_28px_rgba(168,85,247,0.26)] sm:max-w-xl sm:p-6 [&>button]:right-4 [&>button]:top-4 [&>button]:grid [&>button]:size-11 [&>button]:place-items-center [&>button]:rounded-full [&>button]:border-2 [&>button]:border-fuchsia-100 [&>button]:bg-[#2b0b66]/95 [&>button]:text-white [&>button]:opacity-100 [&>button]:shadow-[0_0_18px_rgba(217,70,239,0.95),inset_0_1px_8px_rgba(255,255,255,0.24)] [&>button>svg]:size-6">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-3 pr-12 font-display text-3xl font-black text-white drop-shadow-[0_4px_0_rgba(76,29,149,0.95),0_0_14px_rgba(217,70,239,0.95)] sm:text-4xl">
                <span className="relative grid size-20 shrink-0 place-items-center">
                  <span className="absolute inset-1 rounded-full bg-fuchsia-500/45 blur-xl" />
                  <span className="relative grid size-16 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#ffb7ff,#a855f7_48%,rgba(59,7,100,0.1)_82%,transparent)]">
                    <Trophy className="size-11 fill-yellow-300 text-yellow-950 drop-shadow-[0_2px_2px_rgba(0,0,0,0.24)]" />
                    <span className="absolute left-5 top-4 size-2 rounded-full bg-white/80 blur-[1px]" />
                  </span>
                  <Star className="absolute right-0 top-2 size-4 fill-yellow-200 text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.95)]" />
                  <Star className="absolute left-0 bottom-3 size-3 fill-yellow-200 text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.95)]" />
                </span>
                Achievements
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[64vh] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(232,121,249,0.75)_transparent]">
              <div className="grid gap-3">
              {(achievementSummary?.achievements ?? []).map((achievement) => {
                const AchievementIcon = achievementIconForTitle(achievement.title);
                const iconStyle = achievementIconStyleForTitle(achievement.title, achievement.unlocked);
                return (
                <div
                  key={achievement.id}
                  className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3 py-4 backdrop-blur-md sm:gap-4 sm:p-4 ${
                    achievement.unlocked
                      ? "border-fuchsia-100 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.3),transparent_19%),linear-gradient(135deg,#a735ff,#5c16ba)] shadow-[0_0_24px_rgba(217,70,239,0.92),inset_0_1px_20px_rgba(255,255,255,0.3),inset_0_-18px_34px_rgba(76,29,149,0.35)]"
                      : "border-violet-400/45 bg-[linear-gradient(135deg,rgba(21,8,52,0.92),rgba(6,1,24,0.96))] shadow-[0_0_12px_rgba(124,58,237,0.24),inset_0_1px_14px_rgba(255,255,255,0.08)]"
                  }`}
                >
                  {achievement.unlocked && <Star className="absolute right-5 top-4 size-4 fill-yellow-200 text-yellow-200 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />}
                  <span className={`relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border shadow-[inset_0_2px_12px_rgba(255,255,255,0.24),0_3px_10px_rgba(0,0,0,0.2)] sm:size-20 ${iconStyle.shell}`}>
                    <span className="absolute left-3 top-2 size-4 rounded-full bg-white/55 blur-[2px]" />
                    <AchievementIcon className={`relative size-9 drop-shadow-[0_2px_2px_rgba(0,0,0,0.24)] sm:size-11 ${iconStyle.icon}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-display text-lg font-black sm:text-xl ${achievement.unlocked ? "text-white" : "text-violet-100/85"}`}>{achievement.title}</span>
                    <span className={`mt-1 block text-sm font-bold ${achievement.unlocked ? "text-violet-50/85" : "text-violet-200/65"}`}>{achievement.description}</span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black ${
                    achievement.unlocked
                      ? "border-fuchsia-100/80 bg-fuchsia-400/40 text-white shadow-[0_0_14px_rgba(245,208,254,0.55),inset_0_1px_8px_rgba(255,255,255,0.2)]"
                      : "border-violet-300/30 bg-white/8 text-violet-200"
                  }`}>
                    {achievement.unlocked ? (
                      <span className="flex items-center gap-1"><Check className="size-3.5" /> Completed</span>
                    ) : (
                      <span className="flex items-center gap-1"><Lock className="size-3.5" /> {achievementLockedLabel(achievement.title)}</span>
                    )}
                  </span>
                </div>
                );
              })}
              {(achievementSummary?.achievements ?? []).length === 0 && <p className="text-sm text-violet-100">No achievements loaded yet.</p>}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-fuchsia-200/40 bg-white/8 px-4 py-3 text-sm font-bold text-violet-100 shadow-[0_0_18px_rgba(217,70,239,0.34),inset_0_1px_10px_rgba(255,255,255,0.12)]">
                <Star className="size-5 fill-fuchsia-300 text-fuchsia-200" />
                Keep creating, keep growing, keep KULTing!
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={openPanel === "notifications"}
          onOpenChange={(open) => {
            if (!open) {
              setOpenPanel(null);
              return;
            }
            void markNotificationsRead(getCurrentUserId()).then(() => {
              setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
            }).catch(() => null);
          }}
        >
          <DialogContent className="max-h-[82vh] overflow-y-auto border-border/60 bg-card sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-xl font-black">
                <Bell className="size-5 text-primary" /> Notifications
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div
                  key={`${notification.createdAt}-${index}`}
                  className={`rounded-lg border p-4 ${notification.read ? "border-border/50 bg-background/30" : "border-primary/45 bg-primary/10"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold">{notification.title}</p>
                    {!notification.read && <span className="mt-1 size-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
                </div>
              ))}
              {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 hidden overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-card sm:block">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
                <Gift className="size-4" /> Referral rewards
              </span>
              <h3 className="mt-2 font-display text-2xl font-black">Invite players. Earn KP and Creator Score.</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Referral rewards land after a referred player completes an authenticated game session
                longer than 30 seconds.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-border/60 bg-background/45 px-5 py-3 text-center">
                <p className="font-display text-xl font-black">{formatStat(todayPoints)}</p>
                <p className="label-mono text-[8px] text-muted-foreground">Today CS</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/45 px-5 py-3 text-center">
                <p className="font-display text-xl font-black">{formatStat(weekPoints)}</p>
                <p className="label-mono text-[8px] text-muted-foreground">Week CS</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/45 px-5 py-3 text-center">
                <p className="font-display text-xl font-black">{referral?.count ?? 0}</p>
                <p className="label-mono text-[8px] text-muted-foreground">Rewarded referrals</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/45 px-5 py-3 text-center">
                <p className="font-display text-xl font-black text-primary">{referral?.kpEarned ?? 0} KP</p>
                <p className="label-mono text-[8px] text-muted-foreground">Referral earnings</p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-2 rounded-xl border border-border/60 bg-background/50 p-2 pl-4">
            <input
              readOnly
              value={referral?.link ?? "Loading your permanent referral link..."}
              className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
            />
            <button
              disabled={!referral}
              onClick={async () => {
                if (!referral) return;
                await navigator.clipboard.writeText(referral.link);
                setReferralCopied(true);
                setTimeout(() => setReferralCopied(false), 1800);
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {referralCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {referralCopied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>

        <div className="mt-8 sm:hidden">
          <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-7 border-b border-violet-700/25">
              {profileGameSections.map((section) => {
                const selected = selectedMobileGameSection.title === section.title;
                return (
                  <button
                    key={section.title}
                    type="button"
                    onClick={() => setMobileGameTab(section.title)}
                    className={`relative pb-3 font-display text-base font-black transition ${
                      selected
                        ? "text-black drop-shadow-[0_1px_6px_rgba(255,255,255,0.5)]"
                        : "text-violet-800/80"
                    }`}
                  >
                    {section.title}
                    {selected && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-black" />}
                  </button>
                );
              })}
            </div>
          </div>
          <GameRow
            title={selectedMobileGameSection.title}
            games={selectedMobileGameSection.games}
            onEditGame={selectedMobileGameSection.onEditGame}
            emptyMessage={selectedMobileGameSection.emptyMessage}
          />
        </div>

        <div className="hidden sm:block">
          {profileGameSections.map((section) => (
            <GameRow
              key={section.title}
              title={section.title}
              games={section.games}
              onEditGame={section.onEditGame}
              emptyMessage={section.emptyMessage}
            />
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-black text-violet-700 drop-shadow-[0_0_10px_rgba(124,58,237,0.35)] sm:text-foreground sm:drop-shadow-none">Recent Activity</h2>
            
            <Select
              value={timeFilter}
              onValueChange={(value) => setTimeFilter(value as TimeFilter)}
            >
              <SelectTrigger className="h-12 w-full min-w-[180px] rounded-[1.35rem] border-2 border-fuchsia-200 bg-[linear-gradient(145deg,#1c0846,#0b0224)] px-5 font-display text-sm font-bold text-fuchsia-300 shadow-[0_0_30px_rgba(217,70,239,0.65),inset_0_1px_16px_rgba(255,255,255,0.14)] backdrop-blur-sm transition hover:border-fuchsia-100 hover:bg-[#24104d] sm:h-11 sm:w-[190px] sm:rounded-xl sm:border sm:border-border/70 sm:bg-card/55 sm:px-4 sm:text-primary sm:shadow-[0_0_22px_oklch(0.7_0.25_315/0.12)] sm:backdrop-blur-none sm:hover:border-primary/55 sm:hover:bg-primary/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="overflow-hidden rounded-2xl border-border/70 bg-[oklch(0.14_0.02_282/0.98)] p-2 text-foreground shadow-[0_18px_60px_oklch(0_0_0/0.55),0_0_34px_oklch(0.7_0.25_315/0.18)] backdrop-blur-xl">
                {[
                  ["today", "Today"],
                  ["week", "This Week"],
                  ["month", "This Month"],
                  ["all", "All Time"],
                ].map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="my-1 rounded-xl py-2.5 pl-3 pr-9 font-display text-sm font-bold text-muted-foreground focus:bg-primary/15 focus:text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground [&>span:last-child]:right-3"
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative mt-4 overflow-hidden rounded-[1.55rem] border-2 border-fuchsia-200 bg-[linear-gradient(145deg,#1c0846,#0b0224)] p-3 shadow-[0_0_34px_rgba(217,70,239,0.72),inset_0_1px_18px_rgba(255,255,255,0.15)] backdrop-blur-sm sm:mt-6 sm:rounded-2xl sm:border sm:border-border/60 sm:bg-card/40 sm:p-6 sm:shadow-card sm:backdrop-blur-none">
            {activitiesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="mt-2 text-sm">Loading activity history...</p>
              </div>
            ) : filteredActivities.length > 0 ? (
              <>
                <div className="relative max-h-56 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(232,121,249,0.65)_transparent] sm:max-h-96 sm:space-y-8">
                  {filteredActivities.slice(0, showAllActivities ? undefined : 2).map((activity) => {
                    const IconComponent = activityIcons[activity.activityType] || Gamepad2;
                    const colorClass = activityColors[activity.activityType] || "text-muted-foreground bg-muted";
                    
                    return (
                      <div key={activity._id} className="group grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-3">
                        {/* Timeline Node Icon */}
                        <div className={`flex size-6 items-center justify-center rounded-full border transition-all duration-300 group-hover:scale-110 sm:size-8 ${colorClass}`}>
                          <IconComponent className="size-3.5 sm:size-4" />
                        </div>
                        
                        {/* Activity Content */}
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-fuchsia-200/35 bg-[#2b135c]/75 px-3 py-2 text-white shadow-[0_0_16px_rgba(217,70,239,0.28),inset_0_1px_10px_rgba(255,255,255,0.12)] transition-all duration-300 hover:border-fuchsia-200/70 hover:bg-[#35146e]/90 sm:gap-4 sm:border-border/40 sm:bg-card/20 sm:p-4 sm:text-foreground sm:hover:border-primary/20 sm:hover:bg-card/40 sm:shadow-none">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-5 text-white sm:text-foreground">
                              {activity.details}
                            </p>
                            <p className="text-xs leading-4 text-violet-200/75 sm:mt-1 sm:text-muted-foreground">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          
                          {activity.gameId && (
                            <button
                              onClick={() => navigate({ to: "/play/$gameId", params: { gameId: activity.gameId! } })}
                              className="shrink-0 rounded-full border border-fuchsia-300/30 bg-[#1a0a38]/40 px-3 py-1 text-xs font-bold text-fuchsia-300 transition-colors hover:border-fuchsia-300/70 hover:bg-fuchsia-400/10 active:scale-95 sm:rounded-lg sm:border-border/60 sm:bg-transparent sm:py-1.5 sm:text-primary sm:hover:border-primary sm:hover:bg-primary/5"
                            >
                              Play Game
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredActivities.length > 2 && (
                  <button
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl border border-fuchsia-200/40 bg-[#2b135c]/75 py-3 text-sm font-bold text-fuchsia-200 shadow-[0_0_16px_rgba(217,70,239,0.3),inset_0_1px_10px_rgba(255,255,255,0.12)] transition-all hover:border-fuchsia-200/80 hover:bg-[#35146e]/90 active:scale-[0.99] sm:border-border/60 sm:bg-secondary/20 sm:text-primary sm:shadow-none sm:hover:bg-secondary/40 sm:hover:text-primary-foreground"
                  >
                    {showAllActivities ? "Show less" : "View all"}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-6">
                No recent activity found for the selected time range.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
