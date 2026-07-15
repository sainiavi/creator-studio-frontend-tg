import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gamepad2,
  Globe2,
  Heart,
  MessageCircle,
  Mountain,
  Pencil,
  Play,
  Puzzle,
  Repeat2,
  Rocket,
  Search,
  Share2,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Volleyball,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { resolveGameThumbnail } from "@/lib/studio-meta";
import { fetchGamesPage } from "@/lib/api/games";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { VIEWS_TOP_LIMIT } from "@/lib/pagination";
import {
  gradientClass,
  trending as demoTrending,
  fresh as demoFresh,
  type Game,
} from "@/lib/games-data";
import { fetchCreatorScoreLeaderboard, type CreatorScoreEntry } from "@/lib/api/leaderboards";
import rankOneAvatar from "@/assets/leaderboard-rank-1.png";
import rankTwoAvatar from "@/assets/leaderboard-rank-2.png";
import rankThreeAvatar from "@/assets/leaderboard-rank-3.png";
import { useStudioContext } from "@/context/StudioContext";
import { api } from "@/lib/api";
import {
  fetchCreatorStats,
  fetchNotifications,
  fetchPointSummary,
  fetchRecentActivities,
  fetchSocialStats,
  markNotificationsRead,
  toggleLike,
  type CreatorStats,
  type NotificationItem,
  type UserActivity,
} from "@/lib/api/social";
import { ShareGameModal } from "@/components/studio/ShareGameModal";
import { TelegramSignInButton } from "@/components/studio/TelegramSignInButton";
import { getCurrentUserId } from "@/lib/identity";
import profileBg from "@/assets/profile-bg.png";
import mobileHomeBg from "@/assets/mobile-bg.png";
import mobileHomeBottomBg from "@/assets/mobile-bg-bottom.png";
import heroFrame from "@/assets/hero-frame.png";

// Full home page — lazy-loaded from _app.index.tsx (not a registered route file).
// export const Route = createFileRoute("/_app/")({
//   head: () => ({
//     meta: [
//       { title: "Home - Creator Studio" },
//       { name: "description", content: "Create, publish, and grow playable games with AI." },
//     ],
//   }),
//   component: Home,
// });

// Maps a real backend activity type to the icon/color used in the feed.
const activityStyle: Partial<
  Record<string, { icon: ComponentType<{ className?: string }>; color: string }>
> = {
  like: { icon: Heart, color: "text-neon-pink" },
  favorite: { icon: Sparkles, color: "text-neon-violet" },
  share: { icon: Share2, color: "text-neon-green" },
  comment: { icon: MessageCircle, color: "text-neon-cyan" },
  create: { icon: WandSparkles, color: "text-neon-violet" },
  play: { icon: Play, color: "text-neon-cyan" },
  publish: { icon: Rocket, color: "text-neon-pink" },
  major_edit: { icon: Pencil, color: "text-neon-green" },
  unpublish: { icon: X, color: "text-muted-foreground" },
  reward_claim: { icon: Trophy, color: "text-neon-green" },
};

function relativeTime(timestamp: string) {
  const ms = Date.now() - Date.parse(timestamp);
  if (!Number.isFinite(ms) || ms < 0) return "now";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const preferredCategories = ["Action", "Arcade", "Racing", "Puzzle", "Strategy"];
const categoryPriority = ["Action", "Arcade", "Racing", "Puzzle", "Strategy"];
const placeholderSlots = Array.from({ length: 6 }, (_, index) => index);

// The fixed category chips on the mobile home ("Browse by Category").
const browseCategories: {
  name: string;
  icon: ComponentType<{ className?: string }>;
  chip: string;
  iconColor: string;
}[] = [
  {
    name: "Action",
    icon: Swords,
    chip: "border-neon-pink/30 bg-neon-pink/10",
    iconColor: "text-neon-pink",
  },
  {
    name: "Arcade",
    icon: Gamepad2,
    chip: "border-neon-violet/35 bg-neon-violet/10",
    iconColor: "text-neon-violet",
  },
  {
    name: "Puzzle",
    icon: Puzzle,
    chip: "border-blue-400/30 bg-blue-400/10",
    iconColor: "text-blue-400",
  },
  {
    name: "Sports",
    icon: Volleyball,
    chip: "border-emerald-400/30 bg-emerald-400/10",
    iconColor: "text-emerald-400",
  },
  {
    name: "Strategy",
    icon: Trophy,
    chip: "border-cyan-400/30 bg-cyan-400/10",
    iconColor: "text-cyan-400",
  },
  {
    name: "Adventure",
    icon: Mountain,
    chip: "border-teal-300/30 bg-teal-300/10",
    iconColor: "text-teal-300",
  },
  {
    name: "RPG",
    icon: Shield,
    chip: "border-orange-400/30 bg-orange-400/10",
    iconColor: "text-orange-400",
  },
  {
    name: "Multiplayer",
    icon: Users,
    chip: "border-violet-400/30 bg-violet-400/10",
    iconColor: "text-violet-400",
  },
];

const homeFeedTabs = ["For You", "Trending", "New", ...browseCategories.map((c) => c.name)];

function shortAddress(value: string | undefined) {
  if (!value) return "";
  return value.startsWith("0x") && value.length > 12
    ? `${value.slice(0, 6)}...${value.slice(-4)}`
    : value;
}

function homeCategory(category: string | undefined) {
  const value = String(category ?? "Game").trim();
  const lower = value.toLowerCase();
  if (lower.includes("strategy")) return "Strategy";
  if (lower.includes("board")) return "Board Games";
  if (lower.includes("puzzle")) return "Puzzle";
  if (lower.includes("racing")) return "Racing";
  if (lower.includes("arcade")) return "Arcade";
  if (lower.includes("action")) return "Action";
  return value || "Game";
}

function withHomeCategory(game: Game): Game {
  return { ...game, category: homeCategory(game.category) };
}

function numericPlays(plays: string) {
  if (plays === "New") return Number.POSITIVE_INFINITY;
  const value = Number.parseFloat(plays);
  if (plays.endsWith("M")) return value * 1_000_000;
  if (plays.endsWith("K")) return value * 1_000;
  return value || 0;
}

function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function countFromLabel(value: string | undefined) {
  if (!value || value === "New") return 0;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  if (value.endsWith("M")) return Math.round(parsed * 1_000_000);
  if (value.endsWith("K")) return Math.round(parsed * 1_000);
  return Math.round(parsed);
}

function uniqueGames(games: Game[]) {
  return games.filter(
    (game, index, collection) =>
      collection.findIndex((candidate) => candidate.templateId === game.templateId) === index,
  );
}

export function Home() {
  const navigate = useNavigate();
  const { createdGames, removeCreatedGame } = useStudioContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [kultPoints, setKultPoints] = useState(0);
  const [kpLevel, setKpLevel] = useState(1);
  const [, setIsSearching] = useState(false);
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileFeedTab, setMobileFeedTab] = useState("For You");
  const [recentEventsOpen, setRecentEventsOpen] = useState(false);
  const [mobileIdea, setMobileIdea] = useState("");
  const mobileIdeaInputRef = useRef<HTMLInputElement>(null);

  const openCreateWithMobileIdea = useCallback(() => {
    const prompt = mobileIdea.trim();
    if (!prompt) {
      mobileIdeaInputRef.current?.focus();
      return;
    }
    sessionStorage.setItem("kult-create-prompt", prompt);
    navigate({ to: "/create" });
  }, [mobileIdea, navigate]);

  const formatStat = useCallback((value: number | undefined) => {
    const n = value ?? 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }, []);

  const [activities, setActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    const userId = getCurrentUserId();
    fetchCreatorStats(userId)
      .then(setCreatorStats)
      .catch(() => {
        setCreatorStats(null);
      });
    fetchRecentActivities(50)
      .then((items) => setActivities(items))
      .catch(() => setActivities([]));
    const refreshNotifications = () => {
      fetchNotifications(userId)
        .then((data) => setNotifications(data.notifications))
        .catch(() => {
          setNotifications([]);
        });
    };
    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const openNotifications = async () => {
    setNotificationsOpen(true);
    const userId = getCurrentUserId();
    const data = await fetchNotifications(userId).catch(() => null);
    if (data) setNotifications(data.notifications);
    await markNotificationsRead(userId).catch(() => null);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const openNotificationTarget = (notification: NotificationItem) => {
    if (!notification.gameId) return;
    setNotificationsOpen(false);
    navigate({ to: "/play/$gameId", params: { gameId: notification.gameId } });
  };

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      api
        .get(`/games/list?q=${encodeURIComponent(query)}&limit=20`)
        .then((res) => {
          const games: any[] = res.data?.games ?? [];
          const mapped = games.map((g: any, index: number) => ({
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
          setSearchResults(mapped);
        })
        .catch(() => {
          // fail silently
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);
  useEffect(() => {
    fetchPointSummary(getCurrentUserId())
      .then((summary) => {
        setKultPoints(summary.kultPoints ?? summary.lifetimePoints ?? 0);
        setKpLevel(summary.level?.level ?? 1);
      })
      .catch(() => {});
  }, []);

  // The user's own creations (from this browser and from the backend) — without
  // this, search only covered the static template showcase.
  const myCreations: Game[] = useMemo(
    () =>
      createdGames
        .filter((g: any) => g?.title)
        .filter(
          (g: any, i: number, all: any[]) =>
            !g?.id || all.findIndex((x: any) => x?.id === g.id) === i,
        )
        .map((g: any, index: number) => ({
          title: g.title,
          category: g.category ?? "Game",
          plays: g.views
            ? g.views >= 1000
              ? `${(g.views / 1000).toFixed(1)}K`
              : String(g.views)
            : "New",
          emoji: "🎮",
          gradient: (index % 2 === 0 ? "violet" : "cyan") as "violet" | "cyan",
          creator: "you",
          creatorId: g.creatorId ?? getCurrentUserId(),
          thumbnailUrl: resolveGameThumbnail(g),
          templateId: g.id ?? g.templateId,
          likes: Number(g.points?.likes ?? 0),
          prompt: g.customization?.prompt || "",
        })),
    [createdGames],
  );

  // The user's own game packages (same source as the profile page's My Games),
  // newest first — real titles, thumbnails, publish state, and update times.
  const myProjects = useMemo(
    () =>
      (createdGames as any[])
        .filter((g: any) => g?.title)
        .filter(
          (g: any, i: number, all: any[]) =>
            !g?.id || all.findIndex((x: any) => x?.id === g.id) === i,
        )
        .sort(
          (a: any, b: any) =>
            (Date.parse(b?.updatedAt ?? b?.createdAt ?? "") || 0) -
            (Date.parse(a?.updatedAt ?? a?.createdAt ?? "") || 0),
        )
        .slice(0, 4),
    [createdGames],
  );

  const fallbackActivities: UserActivity[] = useMemo(
    () =>
      myProjects.map((game: any, index: number) => ({
        _id: `local-${game.id ?? game.templateId ?? index}`,
        userId: game.creatorId ?? getCurrentUserId(),
        gameId: game.id ?? game.templateId ?? null,
        gameTitle: game.title ?? null,
        activityType: game.publish?.published ? "publish" : "create",
        details: game.publish?.published ? `Published ${game.title}` : `Created ${game.title}`,
        timestamp: game.updatedAt ?? game.createdAt ?? new Date().toISOString(),
      })),
    [myProjects],
  );

  const displayedActivities = activities.length > 0 ? activities : fallbackActivities;
  const recentEventsPreview = displayedActivities.slice(0, 4);

  // Real view counts drive the Trending order: most viewed first.
  const [viewsMap, setViewsMap] = useState<Record<string, number>>({});
  const [communityGames, setCommunityGames] = useState<Game[]>([]);
  const [gamesOffset, setGamesOffset] = useState(0);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [loadingMoreGames, setLoadingMoreGames] = useState(false);

  const mergeCommunityGames = useCallback((incoming: Game[], append: boolean) => {
    setCommunityGames((current) => {
      const merged = append ? [...current, ...incoming] : incoming;
      return uniqueGames(merged);
    });
  }, []);

  const loadGamesPage = useCallback(
    async (offset: number, append: boolean) => {
      const { games, hasMore } = await fetchGamesPage(offset);
      mergeCommunityGames(games, append);
      setGamesOffset(offset + games.length);
      setHasMoreGames(hasMore);
    },
    [mergeCommunityGames],
  );

  useEffect(() => {
    api
      .get("/social/views-top", { params: { limit: VIEWS_TOP_LIMIT } })
      .then((res) => {
        const map: Record<string, number> = {};
        for (const g of res.data?.games ?? []) map[g.gameId] = g.views;
        setViewsMap(map);
      })
      .catch(() => {});
    void loadGamesPage(0, false).catch(() => {});
  }, [loadGamesPage]);

  const loadMoreGames = useCallback(() => {
    if (!hasMoreGames || loadingMoreGames) return;
    setLoadingMoreGames(true);
    void loadGamesPage(gamesOffset, true)
      .catch(() => {})
      .finally(() => setLoadingMoreGames(false));
  }, [gamesOffset, hasMoreGames, loadGamesPage, loadingMoreGames]);

  const gamesLoadMoreRef = useInfiniteScroll(
    loadMoreGames,
    hasMoreGames && !searchQuery.trim(),
  );

  const latestGames = useMemo(
    () =>
      [...communityGames].sort(
        (first, second) =>
          (Date.parse(second.createdAt ?? "") || 0) - (Date.parse(first.createdAt ?? "") || 0),
      ),
    [communityGames],
  );

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = mobileHomeBg;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  const realGames = useMemo(
    () => uniqueGames([...myCreations, ...communityGames].map(withHomeCategory)),
    [myCreations, communityGames],
  );

  const shelves = useMemo(() => {
    const realViews = (game: Game) => viewsMap[game.templateId ?? ""] ?? 0;
    const withRealPlays = (game: Game): Game => {
      const v = realViews(game);
      if (v <= 0) return game;
      return { ...game, plays: v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v) };
    };
    // Most-viewed first; only real created/community games are shown on Home.
    const trending = [...realGames]
      .filter((game, i, all) => all.findIndex((x) => x.templateId === game.templateId) === i)
      .sort((first, second) => realViews(second) - realViews(first))
      .map(withRealPlays);
    const latest = uniqueGames([...latestGames, ...myCreations].map(withHomeCategory)).map(
      withRealPlays,
    );
    const playersChoice = uniqueGames([
      ...preferredCategories.flatMap((category) =>
        trending.filter((game) => game.category === category),
      ),
      ...trending,
    ]);
    const favorites = uniqueGames([...trending])
      .sort((first, second) => (second.likes ?? 0) - (first.likes ?? 0))
      .slice(0, 14);

    const categories = Array.from(new Set(realGames.map((game) => game.category))).sort(
      (first, second) => {
        const firstPriority = categoryPriority.indexOf(first);
        const secondPriority = categoryPriority.indexOf(second);
        if (firstPriority !== -1 || secondPriority !== -1) {
          if (firstPriority === -1) return 1;
          if (secondPriority === -1) return -1;
          return firstPriority - secondPriority;
        }
        return first.localeCompare(second);
      },
    );

    return [
      { title: "Trending", games: trending },
      { title: "Latest", games: latest },
      { title: "Players' Choice", games: playersChoice },
      { title: "Favourite Games", games: favorites },
      ...categories.map((category) => ({
        title: category,
        games: realGames.filter((game) => game.category === category),
      })),
    ].filter((shelf) => shelf.games.length > 0);
  }, [realGames, myCreations, viewsMap, latestGames]);

  const visibleShelves = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return shelves;

    // Local matches across all shelves as an instant starting point
    const localMatches = shelves
      .flatMap((shelf) => shelf.games)
      .filter(
        (game, index, self) =>
          self.findIndex((g) => g.templateId === game.templateId || g.title === game.title) ===
          index,
      )
      .filter((game) =>
        [game.title, game.category, game.creator, game.prompt || ""].some((value) =>
          value.toLowerCase().includes(query),
        ),
      );

    // Merge local matches with background search results from DB
    const allResults = [...searchResults];
    localMatches.forEach((lm) => {
      if (!allResults.some((ar) => ar.templateId === lm.templateId || ar.title === lm.title)) {
        allResults.push(lm);
      }
    });

    return [{ title: `Search Results for “${searchQuery}”`, games: allResults }];
  }, [searchQuery, shelves, searchResults]);

  // Real games power the mobile home; the static showcase list fills in until
  // the backend returns anything, so the page never renders empty.
  const trendingNow = useMemo(() => {
    const games = shelves.find((shelf) => shelf.title === "Trending")?.games ?? [];
    return games.length > 0 ? games : demoTrending;
  }, [shelves]);

  const newReleases = useMemo(() => {
    const games = shelves.find((shelf) => shelf.title === "Latest")?.games ?? [];
    return games.length > 0 ? games : demoFresh;
  }, [shelves]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const game of realGames) counts[game.category] = (counts[game.category] ?? 0) + 1;
    return counts;
  }, [realGames]);

  const feedTabGames = useMemo(() => {
    if (mobileFeedTab === "Trending") return trendingNow;
    if (mobileFeedTab === "New") return newReleases;
    return realGames.filter((game) => game.category === mobileFeedTab);
  }, [mobileFeedTab, trendingNow, newReleases, realGames]);

  const [topCreators, setTopCreators] = useState<CreatorScoreEntry[]>([]);
  useEffect(() => {
    fetchCreatorScoreLeaderboard(10)
      .then((board) => setTopCreators(board.entries))
      .catch(() => setTopCreators([]));
  }, []);

  const openGame = useCallback(
    (game: Game) => {
      if (game.templateId) navigate({ to: "/play/$gameId", params: { gameId: game.templateId } });
    },
    [navigate],
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#d8cff8_0%,#c4b6f2_42%,#9f87e7_100%)] text-violet-950 sm:bg-[#f4ddff]">
      <img
        src={mobileHomeBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-0 h-auto w-[101%] max-w-none -translate-x-1/2 object-contain sm:hidden"
      />
      <img
        src={mobileHomeBottomBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[clamp(590px,184.6vw,800px)] z-0 h-[calc(100%_-_clamp(590px,184.6vw,800px))] w-[101%] max-w-none -translate-x-1/2 object-fill sm:hidden"
      />
      <div className="pointer-events-none absolute left-1/2 top-[clamp(87px,27.2vw,118px)] z-[20] w-[58%] -translate-x-1/2 text-center sm:hidden">
        <p className="font-display text-[clamp(7px,2.3vw,10px)] font-black uppercase tracking-[0.1em] text-violet-800 drop-shadow-[0_1px_0_rgba(255,255,255,1)] [text-shadow:0_1px_0_rgba(255,255,255,1),0_0_8px_rgba(124,58,237,0.45)]">
          ✧ You Imagine. AI Builds. ✧
        </p>
        <h1 className="mt-1 font-display text-[clamp(34px,10.8vw,47px)] font-black uppercase leading-[1.03] text-white drop-shadow-[0_2px_0_#6d28d9] [-webkit-text-stroke:1.4px_#5b21b6]">
          Create
          <span className="mx-auto block w-max -translate-x-4 bg-[linear-gradient(180deg,#ff6bea_0%,#8b5cf6_74%)] bg-clip-text text-transparent drop-shadow-[0_3px_0_#4c1d95] [-webkit-text-stroke:1px_#5b21b6]">
            Playable
          </span>
          <span className="mx-auto block w-max bg-[linear-gradient(180deg,#ff75ec_0%,#7c3aed_78%)] bg-clip-text text-transparent drop-shadow-[0_3px_0_#4c1d95] [-webkit-text-stroke:1px_#5b21b6]">
            Worlds
          </span>
        </h1>
      </div>
      <p className="pointer-events-none absolute left-[48%] top-[clamp(269px,84.1vw,365px)] z-[3] w-[60%] -translate-x-1/2 text-center text-[clamp(12px,3.6vw,16px)] font-black leading-[1.08] text-[#2b075f] drop-shadow-[0_1px_0_rgba(255,255,255,1)] [text-shadow:0_1px_0_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.9),0_0_14px_rgba(168,85,247,0.45)] sm:hidden">
        Describe your game idea
        <br />
        and our AI crafts the game,
        <br />
        agents, and world.
      </p>
      <img
        src={heroFrame}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[clamp(160px,50vw,217px)] z-[1] h-auto w-[108%] max-w-none -translate-x-1/2 object-contain sm:hidden"
      />
      <section className="pointer-events-auto absolute left-1/2 top-[clamp(316px,98.8vw,428px)] z-[60] w-[51%] -translate-x-1/2 rounded-md bg-[#090018] px-[clamp(6px,2.05vw,9px)] py-[clamp(8px,2.56vw,11px)] text-center shadow-[0_0_16px_rgba(124,58,237,0.5),inset_0_1px_10px_rgba(255,255,255,0.08)] sm:hidden">
        <p className="mb-1 font-display text-[clamp(5px,1.54vw,7px)] font-black uppercase tracking-[0.08em] text-fuchsia-400 [text-shadow:0_0_8px_rgba(217,70,239,0.85)]">
          What do you want to create?
        </p>
        <label
          className="flex h-[clamp(32px,10.25vw,44px)] items-center gap-1.5 rounded border border-fuchsia-500/80 bg-[#190b3d] px-2 shadow-[0_0_10px_rgba(168,85,247,0.32),inset_0_1px_8px_rgba(255,255,255,0.08)] focus-within:border-fuchsia-300 focus-within:shadow-[0_0_14px_rgba(217,70,239,0.75),inset_0_1px_8px_rgba(255,255,255,0.12)]"
          onClick={() => mobileIdeaInputRef.current?.focus()}
        >
          <input
            ref={mobileIdeaInputRef}
            type="text"
            value={mobileIdea}
            onChange={(event) => setMobileIdea(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") openCreateWithMobileIdea();
            }}
            placeholder="Describe your game idea..."
            className="pointer-events-auto min-w-0 flex-1 bg-transparent text-[clamp(7px,2.05vw,9px)] font-bold text-white outline-none placeholder:text-violet-200/75"
          />
          <button
            type="button"
            aria-label="Start creating"
            onClick={openCreateWithMobileIdea}
            className="grid size-[clamp(20px,6.4vw,28px)] shrink-0 place-items-center rounded bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white shadow-[0_0_12px_rgba(217,70,239,0.85),inset_0_1px_7px_rgba(255,255,255,0.35)]"
          >
            <WandSparkles className="size-[clamp(12px,3.1vw,15px)]" />
          </button>
        </label>
        <div className="mt-[clamp(4px,1.3vw,6px)] grid grid-cols-4 gap-[clamp(3px,1vw,5px)]">
          {[
            { label: "Sports", icon: Volleyball },
            { label: "Racing", icon: Trophy },
            { label: "RPG", icon: Swords },
            { label: "More", icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  setMobileIdea((current) => current || `${item.label} game with exciting levels`)
                }
                className="grid aspect-[1.08] place-items-center rounded border border-fuchsia-500/65 bg-[#180a3a] text-violet-50 shadow-[0_0_8px_rgba(124,58,237,0.32),inset_0_1px_7px_rgba(255,255,255,0.08)]"
              >
                <Icon className="size-[clamp(12px,3.1vw,15px)]" />
                <span className="text-[clamp(5px,1.3vw,6px)] font-black">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <button
        type="button"
        aria-label="Create with typed idea"
        onClick={openCreateWithMobileIdea}
        className="pointer-events-auto absolute left-1/2 top-[clamp(470px,136vw,590px)] z-[80] size-[clamp(78px,22vw,96px)] -translate-x-1/2 rounded-full sm:hidden"
      />
      <section className="absolute left-1/2 top-[clamp(510px,159.5vw,690px)] z-[2] w-[96%] -translate-x-1/2 rounded-2xl border border-white/90 bg-white/82 px-3 py-2.5 shadow-[0_8px_22px_rgba(124,58,237,0.18),0_0_16px_rgba(255,255,255,0.65),inset_0_1px_9px_rgba(255,255,255,0.88)] backdrop-blur-sm sm:hidden">
        <div className="grid grid-cols-4 divide-x divide-violet-300/70">
          {[
            { title: "1. Describe", body: "Share your idea in simple words.", icon: MessageCircle },
            {
              title: "2. AI Builds",
              body: "Artificial intelligence builds agents & world.",
              icon: Sparkles,
            },
            { title: "3. Playtest", body: "Test instantly in play mode.", icon: Gamepad2 },
            { title: "4. Publish", body: "Launch your game to the world.", icon: Rocket },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="px-2 first:pl-0 last:pr-0">
                <span className="mb-2 grid size-10 place-items-center rounded-lg bg-[linear-gradient(145deg,#d946ef,#7c3aed)] text-white shadow-[0_0_12px_rgba(168,85,247,0.5),inset_0_1px_8px_rgba(255,255,255,0.35)]">
                  <Icon className="size-5" />
                </span>
                <p className="text-[10px] font-black leading-tight text-violet-950">{step.title}</p>
                <p className="mt-1 text-[8px] font-bold leading-tight text-violet-900/90">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <img
        src={profileBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full object-cover object-top sm:block"
      />
      <div className="absolute inset-0 z-0 hidden bg-[radial-gradient(circle_at_50%_6%,rgba(255,255,255,0.62),transparent_26%),radial-gradient(circle_at_16%_38%,rgba(244,114,182,0.24),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.24),rgba(216,180,254,0.2))] sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-56 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_42%,transparent_62%)] opacity-70 sm:block" />
      <header className="relative z-10 m-3 flex min-h-16 items-center justify-between gap-3 rounded-[1.65rem] border-2 border-fuchsia-200 bg-[#100528] px-4 py-3 text-white shadow-[0_6px_0_rgba(65,24,138,0.75),0_0_34px_rgba(217,70,239,0.9),inset_0_1px_18px_rgba(255,255,255,0.16)] backdrop-blur sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="font-display text-3xl font-black leading-none text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
              KULT
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-white">Games</p>
          </div>
          <p className="hidden shrink-0 text-sm font-semibold text-violet-100 sm:block">
            <span className="font-black text-white"></span>
          </p>
          <label className="hidden h-10 w-full max-w-md items-center gap-2 rounded-xl border border-fuchsia-200/30 bg-white/10 px-3 shadow-[inset_0_1px_8px_rgba(255,255,255,0.12)] transition focus-within:border-fuchsia-200 sm:flex">
            <Search className="size-4 shrink-0 text-violet-100" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search games, categories, creators..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-200/70"
            />
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <TelegramSignInButton responsive />
          <label className="grid size-10 shrink-0 place-items-center rounded-full border border-fuchsia-200/30 bg-white/10 transition focus-within:border-fuchsia-200 sm:hidden">
            <Search className="size-4 shrink-0 text-white" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search games"
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={() => void openNotifications()}
            title="Open notifications"
            aria-label="Open notifications"
            className="relative grid size-9 place-items-center rounded-full border border-fuchsia-200/30 bg-white/10 text-white transition hover:border-fuchsia-200"
          >
            <Bell className="size-4" />
            {notifications.some((notification) => !notification.read) && (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            )}
          </button>
          <div className="flex items-center gap-2 rounded-full border border-fuchsia-200/30 bg-white/10 px-3 py-2 text-xs font-black text-white sm:rounded-xl">
            <Zap className="size-4 text-fuchsia-200" />
            <span className="sm:hidden">{formatCount(kultPoints)}</span>
            <span className="hidden sm:inline">
              Level {kpLevel} · {formatCount(kultPoints)} KP
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/profile" })}
            title="Open profile"
            aria-label="Open profile"
            className="hidden size-9 place-items-center rounded-full bg-white/10 font-display text-sm font-black text-white transition hover:bg-white/20 sm:grid"
          >
            K
          </button>
        </div>
      </header>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-h-[82vh] overflow-y-auto rounded-[1.5rem] border-2 border-fuchsia-200 bg-white/92 text-violet-950 shadow-[0_0_30px_rgba(168,85,247,0.35)] backdrop-blur sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl font-black">
              <Bell className="size-5 text-primary" /> Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <button
                key={`${notification.createdAt}-${index}`}
                type="button"
                onClick={() => openNotificationTarget(notification)}
                disabled={!notification.gameId}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  notification.read
                    ? "border-border/50 bg-background/30"
                    : "border-primary/45 bg-primary/10"
                } ${notification.gameId ? "hover:border-primary/60" : "cursor-default"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold">{notification.title}</p>
                  {!notification.read && <span className="mt-1 size-1.5 rounded-full bg-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
              </button>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={recentEventsOpen} onOpenChange={setRecentEventsOpen}>
        <DialogContent className="max-h-[82vh] overflow-y-auto rounded-[1.5rem] border-2 border-fuchsia-200 bg-white/92 text-violet-950 shadow-[0_0_30px_rgba(168,85,247,0.35)] backdrop-blur sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl font-black">
              <Globe2 className="size-5 text-primary" /> Recent Events
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y divide-border/40">
            {displayedActivities.map((item) => (
              <ActivityEventRow key={item._id} item={item} />
            ))}
            {displayedActivities.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">No platform events yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative z-10 grid gap-3 px-3 pb-3 pt-[clamp(545px,169.2vw,730px)] sm:pt-0 xl:grid-cols-[minmax(0,1fr)_310px]">
        <main className="min-w-0 space-y-3">
          <section className="min-[1190px]:hidden">
            <div className="mx-auto w-full max-w-2xl space-y-6 px-1">
              {searchQuery.trim() ? (
                <FeedGrid
                  games={visibleShelves[0]?.games ?? []}
                  onOpen={openGame}
                  emptyText={`No games match "${searchQuery}".`}
                />
              ) : (
                <>
                  <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex min-w-max items-center gap-7 border-b border-violet-700/25">
                      {homeFeedTabs.map((tab) => {
                        const selected = mobileFeedTab === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setMobileFeedTab(tab)}
                            className={`relative pb-3 pt-2 text-base font-bold transition ${
                              selected ? "text-black" : "text-violet-800/80"
                            }`}
                          >
                            {tab}
                            {selected && (
                              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-black" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {!searchQuery.trim() &&
                (mobileFeedTab === "For You" ? (
                  <>
                    <MobileShelf
                      title="🔥 Trending Now"
                      games={trendingNow}
                      onViewAll={() => setMobileFeedTab("Trending")}
                      onOpen={openGame}
                    />

                    <MobileShelf
                      title="✨ New Releases"
                      games={newReleases}
                      onViewAll={() => setMobileFeedTab("New")}
                      onOpen={openGame}
                    />

                    <section>
                      <h2 className="mb-3 font-display text-2xl font-black text-violet-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
                        Browse by Category
                      </h2>
                      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {browseCategories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <button
                              key={category.name}
                              type="button"
                              onClick={() => setMobileFeedTab(category.name)}
                              className="flex min-w-[230px] shrink-0 items-center gap-3 rounded-[1.25rem] border-2 border-fuchsia-200 bg-[linear-gradient(145deg,#1c0846,#0b0224)] px-4 py-3.5 text-left text-white shadow-[0_0_24px_rgba(217,70,239,0.58),inset_0_1px_14px_rgba(255,255,255,0.12)] transition hover:border-fuchsia-100 hover:brightness-110"
                            >
                              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 shadow-[inset_0_1px_8px_rgba(255,255,255,0.16)]">
                                <Icon className={`size-5 ${category.iconColor}`} />
                              </span>
                              <span className="min-w-0">
                                <span className="block whitespace-nowrap text-base font-black text-white">
                                  {category.name}
                                </span>
                                <span className="block whitespace-nowrap text-sm font-bold text-violet-200/80">
                                  {formatCount(categoryCounts[category.name] ?? 0)} Games
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {topCreators.length > 0 && (
                      <TopCreatorsRow
                        creators={topCreators}
                        onViewAll={() => navigate({ to: "/leaderboard" })}
                      />
                    )}
                  </>
                ) : (
                  <FeedGrid
                    games={feedTabGames}
                    onOpen={openGame}
                    emptyText={`No ${mobileFeedTab} games yet — be the first to create one!`}
                    onLoadMore={loadMoreGames}
                    hasMore={hasMoreGames}
                    loadingMore={loadingMoreGames}
                  />
                ))}
            </div>
          </section>

          <div className="hidden space-y-3 min-[1190px]:block">
            {visibleShelves.slice(0, 2).map((shelf) => (
              <GameShelf
                key={shelf.title}
                title={shelf.title}
                games={shelf.games}
                cardsPerRow={4}
                onLoadMore={loadMoreGames}
                hasMore={hasMoreGames}
                loadingMore={loadingMoreGames}
                onDeleteGame={
                  shelf.title === "My Creations"
                    ? (game) => {
                        if (game.templateId) void removeCreatedGame(game.templateId);
                      }
                    : undefined
                }
                onEditGame={
                  shelf.title === "My Creations"
                    ? (game) => {
                        if (game.templateId)
                          navigate({ to: "/edit/$gameId", params: { gameId: game.templateId } });
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </main>

        <aside className="hidden space-y-3 min-[1190px]:block">
          <Panel title="Creator Dashboard">
            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="Games Created"
                value={formatStat(creatorStats?.games ?? createdGames.length)}
                icon={Gamepad2}
                color="text-neon-violet"
              />
              <Metric
                label="Total Plays"
                value={formatStat(creatorStats?.plays)}
                icon={Play}
                color="text-neon-cyan"
              />
              <Metric
                label="Creator Score"
                value={formatStat(creatorStats?.creatorScore)}
                icon={Trophy}
                color="text-neon-green"
              />
              <Metric
                label="Kult Points"
                value={formatStat(creatorStats?.lifetimePoints)}
                icon={Zap}
                color="text-neon-pink"
              />
            </div>
            <div className="mt-2 flex items-end justify-between rounded-md bg-background/50 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Followers</p>
                <strong className="mt-1 block text-2xl">
                  {formatStat(creatorStats?.followers)}
                </strong>
              </div>
              <svg viewBox="0 0 120 38" className="h-12 w-36" aria-hidden="true">
                <polyline
                  points="0,31 18,22 35,25 52,14 70,20 87,10 103,15 120,6"
                  fill="none"
                  stroke="oklch(0.85 0.2 150)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </Panel>

          <Panel
            title="Recent Events"
            action="View all"
            onActionClick={() => setRecentEventsOpen(true)}
          >
            {recentEventsPreview.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">
                No platform events yet — created and published games will show up here.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {recentEventsPreview.map((item) => (
                  <ActivityEventRow key={item._id} item={item} />
                ))}
              </div>
            )}
          </Panel>
        </aside>

        <div className="hidden min-w-0 space-y-3 min-[1190px]:block xl:col-span-2">
          {visibleShelves.slice(2).map((shelf) => (
            <GameShelf
              key={shelf.title}
              title={shelf.title}
              games={shelf.games}
              onLoadMore={loadMoreGames}
              hasMore={hasMoreGames}
              loadingMore={loadingMoreGames}
              onDeleteGame={
                shelf.title === "My Creations"
                  ? (game) => {
                      if (game.templateId) void removeCreatedGame(game.templateId);
                    }
                  : undefined
              }
              onEditGame={
                shelf.title === "My Creations"
                  ? (game) => {
                      if (game.templateId)
                        navigate({ to: "/edit/$gameId", params: { gameId: game.templateId } });
                    }
                  : undefined
              }
            />
          ))}
          {(hasMoreGames || loadingMoreGames) && !searchQuery.trim() && (
            <div
              ref={gamesLoadMoreRef}
              className="py-6 text-center text-xs font-semibold text-violet-600"
            >
              {loadingMoreGames ? "Loading more games…" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityEventRow({ item }: { item: UserActivity }) {
  const navigate = useNavigate();
  const style = activityStyle[item.activityType] ?? { icon: Gamepad2, color: "text-neon-cyan" };
  const Icon = style.icon;
  const actor =
    item.userId?.startsWith("0x") && item.userId.length > 10
      ? `${item.userId.slice(0, 6)}...${item.userId.slice(-4)}`
      : item.userId;
  const detail =
    item.details || [actor, item.activityType, item.gameTitle].filter(Boolean).join(" ");
  const content = (
    <>
      <Icon className={`size-4 shrink-0 ${style.color}`} />
      <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={detail}>
        {detail}
      </p>
      <span className="shrink-0 text-[10px] text-muted-foreground/60">
        {relativeTime(item.timestamp)}
      </span>
    </>
  );

  if (item.gameId) {
    return (
      <button
        type="button"
        onClick={() => navigate({ to: "/play/$gameId", params: { gameId: item.gameId! } })}
        className="flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-white/[0.03]"
        aria-label={`Open ${item.gameTitle ?? "game"}`}
      >
        {content}
      </button>
    );
  }

  return <div className="flex items-center gap-3 py-2.5">{content}</div>;
}

function GameShelf({
  title,
  games,
  cardsPerRow,
  onDeleteGame,
  onEditGame,
  onLoadMore,
  hasMore,
  loadingMore,
}: {
  title: string;
  games: Game[];
  cardsPerRow?: number;
  onDeleteGame?: (game: Game) => void;
  onEditGame?: (game: Game) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const modalLoadMoreRef = useInfiniteScroll(
    () => onLoadMore?.(),
    Boolean(showAll && hasMore && onLoadMore),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    loop: false,
    containScroll: "trimSnaps",
    skipSnaps: true,
  });
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!showAll) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowAll(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showAll]);

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

  const openGame = (game: Game) => {
    if (game.templateId) {
      navigate({ to: "/play/$gameId", params: { gameId: game.templateId } });
    }
  };

  const rowItems = [
    ...games.map((game) => ({ type: "game" as const, game })),
    ...placeholderSlots.map((slot) => ({ type: "placeholder" as const, slot })),
  ];

  const basisClass =
    cardsPerRow === 4
      ? "min-w-0 shrink-0 grow-0 basis-[72%] sm:basis-[40%] md:basis-[31%] lg:basis-[calc(25%-6px)] 2xl:basis-[calc(25%-6px)]"
      : "min-w-0 shrink-0 grow-0 basis-[72%] sm:basis-[40%] md:basis-[31%] lg:basis-[calc(20%-7px)] 2xl:basis-[calc(16.666%-7px)]";

  return (
    <>
      <section className="rounded-[1.35rem] border-2 border-fuchsia-200 bg-white/80 p-3 text-violet-950 shadow-[0_10px_24px_rgba(124,58,237,0.16),0_0_20px_rgba(217,70,239,0.18),inset_0_1px_10px_rgba(255,255,255,0.9)] backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-black text-violet-950">{title}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={scrollPrev}
              title="Previous games"
              className="grid size-7 place-items-center rounded-lg border border-violet-300/70 bg-white/70 text-violet-700 transition hover:border-fuchsia-400 hover:text-fuchsia-500"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={scrollNext}
              title="Next games"
              className="grid size-7 place-items-center rounded-lg border border-violet-300/70 bg-white/70 text-violet-700 transition hover:border-fuchsia-400 hover:text-fuchsia-500"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              onClick={() => setShowAll(true)}
              className="ml-2 flex items-center gap-1 text-[10px] font-black text-black"
            >
              View all <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
        <div
          ref={emblaRef}
          className="cursor-grab overflow-hidden select-none active:cursor-grabbing"
        >
          <div className="flex touch-pan-y gap-2">
            {rowItems.map((item, index) => (
              <div
                key={
                  item.type === "game"
                    ? `${item.game.title}-${index}`
                    : `${title}-placeholder-${item.slot}`
                }
                className={basisClass}
              >
                {item.type === "game" ? (
                  <GameTile
                    game={item.game}
                    onOpen={() => openGame(item.game)}
                    onDelete={onDeleteGame ? () => onDeleteGame(item.game) : undefined}
                    onEdit={onEditGame ? () => onEditGame(item.game) : undefined}
                  />
                ) : (
                  <PlaceholderTile />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {showAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-violet-950/55 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAll(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`All ${title}`}
            className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[1.5rem] border-2 border-fuchsia-200 bg-white/90 text-violet-950 shadow-[0_0_36px_rgba(168,85,247,0.45)] backdrop-blur"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-violet-200/70 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
                <p className="mt-1 text-[11px] font-semibold text-violet-600">
                  {games.length} playable games
                </p>
              </div>
              <button
                onClick={() => setShowAll(false)}
                title="Close"
                className="grid size-9 place-items-center rounded-xl border border-violet-300 bg-white/80 text-violet-700 transition hover:border-fuchsia-400 hover:text-fuchsia-500"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {rowItems.map((item, index) =>
                  item.type === "game" ? (
                    <GameTile
                      key={`${item.game.title}-grid-${index}`}
                      game={item.game}
                      onOpen={() => openGame(item.game)}
                      onDelete={onDeleteGame ? () => onDeleteGame(item.game) : undefined}
                      onEdit={onEditGame ? () => onEditGame(item.game) : undefined}
                    />
                  ) : (
                    <PlaceholderTile key={`${title}-grid-placeholder-${item.slot}`} />
                  ),
                )}
              </div>
              {(hasMore || loadingMore) && onLoadMore && (
                <div
                  ref={modalLoadMoreRef}
                  className="py-4 text-center text-xs font-semibold text-violet-600"
                >
                  {loadingMore ? "Loading more games…" : ""}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function PlaceholderTile() {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-dashed border-violet-300/70 bg-white/55 text-left">
      <div className="relative aspect-square overflow-hidden bg-[linear-gradient(135deg,#f5d0fe,#ddd6fe)]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,transparent,oklch(0.72_0.27_340/0.18),transparent)]" />
        <div className="absolute inset-4 rounded border border-border/50" />
      </div>
      <div className="p-2">
        <p className="truncate text-[11px] font-bold text-violet-600">Coming Soon</p>
        <div className="mt-1 flex items-center justify-between text-[9px] text-violet-500/80">
          <span>Placeholder</span>
          <span>--</span>
        </div>
      </div>
    </div>
  );
}

// Inline cover shown when a game has no stored image (e.g. its generated
// cover failed) — anything but a broken-image icon.
const FALLBACK_COVER =
  "data:image/svg+xml;base64," +
  btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2b1a4f"/><stop offset="1" stop-color="#0c1230"/>
      </linearGradient></defs>
      <rect width="400" height="400" fill="url(#g)"/>
      <circle cx="200" cy="170" r="64" fill="none" stroke="#8d6bff" stroke-width="6" opacity="0.7"/>
      <rect x="160" y="150" width="80" height="40" rx="12" fill="#8d6bff" opacity="0.8"/>
      <circle cx="176" cy="170" r="6" fill="#0c1230"/><circle cx="224" cy="170" r="6" fill="#0c1230"/>
      <text x="200" y="290" text-anchor="middle" fill="#b9a8ff" font-family="monospace" font-size="20">AI GAME</text>
    </svg>`,
  );

// Creator stats are shared by every tile from the same creator — fetch once
// per creator per page load, not once per tile.
const creatorStatsCache = new Map<string, Promise<CreatorStats | null>>();

function getCreatorStats(creatorId: string) {
  let promise = creatorStatsCache.get(creatorId);
  if (!promise) {
    promise = fetchCreatorStats(creatorId).catch(() => null);
    creatorStatsCache.set(creatorId, promise);
  }
  return promise;
}

function GameCover({ game, className }: { game: Game; className?: string }) {
  if (!game.thumbnailUrl) {
    return (
      <div
        className={`grid place-items-center bg-gradient-to-br ${gradientClass[game.gradient]} ${className ?? ""}`}
      >
        <span className="text-5xl drop-shadow-[0_6px_16px_oklch(0_0_0/0.4)]">{game.emoji}</span>
      </div>
    );
  }
  return (
    <img
      src={game.thumbnailUrl}
      alt=""
      draggable={false}
      loading="lazy"
      onError={(event) => {
        const img = event.currentTarget;
        if (img.dataset.fallback) return;
        img.dataset.fallback = "1";
        img.src = FALLBACK_COVER;
      }}
      className={`object-cover ${className ?? ""}`}
    />
  );
}

function MobileShelf({
  title,
  games,
  onViewAll,
  onOpen,
}: {
  title: string;
  games: Game[];
  onViewAll: () => void;
  onOpen: (game: Game) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl font-black text-violet-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
          {title}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-sm font-black text-black transition hover:text-violet-800"
        >
          View all <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {games.slice(0, 10).map((game, index) => (
          <div
            key={`${game.templateId ?? game.title}-${index}`}
            className="w-[86%] shrink-0 snap-start sm:w-[31%] sm:max-w-[220px]"
          >
            <GameTile game={game} onOpen={() => onOpen(game)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function FeedGrid({
  games,
  onOpen,
  emptyText,
  onLoadMore,
  hasMore,
  loadingMore,
}: {
  games: Game[];
  onOpen: (game: Game) => void;
  emptyText: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}) {
  const loadMoreRef = useInfiniteScroll(() => onLoadMore?.(), Boolean(onLoadMore && hasMore));

  if (games.length === 0) {
    return <p className="py-12 text-center text-sm font-semibold text-violet-700">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
      {games.map((game, index) => (
        <GameTile
          key={`${game.templateId ?? game.title}-${index}`}
          game={game}
          onOpen={() => onOpen(game)}
        />
      ))}
      {(hasMore || loadingMore) && onLoadMore && (
        <div
          ref={loadMoreRef}
          className="col-span-full py-4 text-center text-xs font-semibold text-violet-600"
        >
          {loadingMore ? "Loading more games…" : ""}
        </div>
      )}
    </div>
  );
}

const rankAvatars: Record<number, string> = {
  1: rankOneAvatar,
  2: rankTwoAvatar,
  3: rankThreeAvatar,
};

function rankBadgeClass(rank: number) {
  if (rank === 1) return "bg-amber-400 text-black";
  if (rank === 2) return "bg-slate-300 text-black";
  if (rank === 3) return "bg-orange-500 text-black";
  return "bg-muted text-foreground";
}

function TopCreatorsRow({
  creators,
  onViewAll,
}: {
  creators: CreatorScoreEntry[];
  onViewAll: () => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl font-black text-violet-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
          👑 Top Creators
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="flex items-center gap-0.5 text-sm font-black text-black transition hover:text-violet-800"
        >
          View all <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {creators.map((entry) => {
          const avatar = rankAvatars[entry.rank];
          const label = shortAddress(entry.creatorId) || entry.name;
          return (
            <div
              key={entry.id ?? entry.creatorId}
              className="flex shrink-0 items-center gap-3 rounded-2xl border border-fuchsia-200/80 bg-white/80 py-3 pl-3 pr-5 text-violet-950 shadow-[0_6px_18px_rgba(124,58,237,0.16)] backdrop-blur"
            >
              <div className="relative shrink-0">
                <span className="block size-11 overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-[oklch(0.65_0.25_295)] to-[oklch(0.72_0.27_340)]">
                  {avatar ? (
                    <img src={avatar} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-sm font-black text-white">
                      {(entry.name || entry.creatorId).replace(/^0x/, "").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span
                  className={`absolute -bottom-0.5 -left-0.5 grid size-5 place-items-center rounded-full border-2 border-background text-[10px] font-black ${rankBadgeClass(entry.rank)}`}
                >
                  {entry.rank}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{label}</p>
                <p className="text-xs font-semibold text-primary">
                  {formatCount(entry.creatorScore)} Points
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GameTile({
  game,
  onOpen,
  onDelete,
  onEdit,
}: {
  game: Game;
  onOpen: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}) {
  const navigate = useNavigate();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(game.likes ?? 0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(game.shares ?? 0);
  const [views, setViews] = useState(countFromLabel(game.plays));
  const [shareCopied, setShareCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [creatorMeta, setCreatorMeta] = useState<{ followers: number; remixes: number } | null>(
    null,
  );

  useEffect(() => {
    setViews(countFromLabel(game.plays));
  }, [game.plays]);

  // Real counts come from the social API, but only once the tile scrolls into
  // view — the "view all" grid can hold 100+ tiles and must not fire 100 GETs.
  useEffect(() => {
    const gameId = game.templateId;
    const creatorId = game.creatorId;
    const node = tileRef.current;
    if ((!gameId && !creatorId) || !node) return;
    let cancelled = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (gameId) {
        fetchSocialStats(gameId, getCurrentUserId())
          .then((stats) => {
            if (cancelled) return;
            setLiked(stats.likes.liked);
            setLikes(stats.likes.count);
            setComments(stats.comments.count);
            setShares(stats.shares.count);
            setViews(stats.views?.count ?? 0);
          })
          .catch(() => {});
      }
      if (creatorId) {
        void getCreatorStats(creatorId).then((stats) => {
          if (cancelled || !stats) return;
          setCreatorMeta({ followers: stats.followers ?? 0, remixes: stats.remixes ?? 0 });
        });
      }
    });
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [game.templateId, game.creatorId]);

  const like = async () => {
    setLiked((value) => !value);
    setLikes((value) => Math.max(0, value + (liked ? -1 : 1)));
    if (!game.templateId) return;
    const result = await toggleLike(game.templateId, getCurrentUserId()).catch(() => null);
    if (result) {
      setLiked(result.liked);
      setLikes(result.count);
    }
  };

  const share = async () => {
    // Real games open the full share modal; showcase cards without a backend
    // id have no shareable play URL, so just copy the current page link.
    if (game.templateId) {
      setShareOpen(true);
      return;
    }
    await navigator.clipboard?.writeText(window.location.href).catch(() => null);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1500);
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

  const stopTilePress = {
    onPointerDown: (event: ReactPointerEvent) => event.stopPropagation(),
    onPointerUp: (event: ReactPointerEvent) => event.stopPropagation(),
  };

  return (
    <div
      ref={tileRef}
      role="button"
      tabIndex={0}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start) return;
        const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (distance < 8) onOpen();
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen();
      }}
      className="group w-full min-w-0 overflow-hidden rounded-[1.5rem] border-2 border-fuchsia-200/80 bg-white/85 text-left text-violet-950 shadow-[0_10px_24px_rgba(124,58,237,0.18),0_0_20px_rgba(217,70,239,0.18),inset_0_1px_10px_rgba(255,255,255,0.92)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-300 hover:shadow-[0_14px_30px_rgba(124,58,237,0.24),0_0_26px_rgba(217,70,239,0.32)]"
    >
      <div className="relative aspect-square overflow-hidden">
        <GameCover
          game={game}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />
        <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-fuchsia-600 shadow-[0_2px_10px_rgba(124,58,237,0.18)] backdrop-blur">
          {game.category}
        </span>
        <span
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-black text-violet-700 shadow-[0_2px_10px_rgba(124,58,237,0.18)] backdrop-blur"
          title={`${formatCount(views)} views`}
        >
          <Eye className="size-3" /> {formatCount(views)} views
        </span>
        {onEdit && (
          <button
            title={`Edit ${game.title}`}
            {...stopTilePress}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="absolute left-2 top-9 z-10 grid size-7 place-items-center rounded-lg border border-fuchsia-200/70 bg-white/85 text-violet-800 opacity-0 shadow-[0_2px_10px_rgba(124,58,237,0.2)] transition group-hover:opacity-100 hover:bg-fuchsia-100 hover:text-fuchsia-600"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            title={`Delete ${game.title}`}
            {...stopTilePress}
            onClick={(event) => {
              event.stopPropagation();
              if (window.confirm(`Delete "${game.title}"? This cannot be undone.`)) onDelete();
            }}
            className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-lg border border-fuchsia-200/70 bg-white/85 text-violet-800 opacity-0 shadow-[0_2px_10px_rgba(124,58,237,0.2)] transition group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display text-xs font-black text-violet-950">{game.title}</p>
          <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.12em] text-violet-500">
            {game.creator}
          </span>
        </div>
        {creatorMeta && (
          <div className="mt-1.5 flex items-center gap-3 text-[9px] font-semibold text-violet-600">
            <span
              className="flex items-center gap-1"
              title={`${game.creator} has ${creatorMeta.followers} followers`}
            >
              <Users className="size-3 text-neon-cyan" /> {formatCount(creatorMeta.followers)}{" "}
              followers
            </span>
            <span
              className="flex items-center gap-1"
              title={`${game.creator}'s games were remixed ${creatorMeta.remixes} times`}
            >
              <Repeat2 className="size-3 text-neon-violet" /> {formatCount(creatorMeta.remixes)}{" "}
              remixes
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-violet-200/70 pt-2">
          <button
            type="button"
            title="Like"
            aria-label={`Like ${game.title}`}
            {...stopTilePress}
            onClick={(event) => {
              event.stopPropagation();
              void like();
            }}
            className={`flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold transition ${
              liked ? "text-rose-500" : "text-violet-600 hover:text-rose-500"
            }`}
          >
            <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} /> {formatCount(likes)}
          </button>
          <button
            type="button"
            title="Comments"
            aria-label={`Comments on ${game.title}`}
            {...stopTilePress}
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-violet-600 transition hover:text-cyan-500"
          >
            <MessageCircle className="size-3.5" /> {formatCount(comments)}
          </button>
          <button
            type="button"
            title={shareCopied ? "Link copied!" : "Share"}
            aria-label={`Share ${game.title}`}
            {...stopTilePress}
            onClick={(event) => {
              event.stopPropagation();
              void share();
            }}
            className="flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-violet-600 transition hover:text-emerald-500"
          >
            <Share2 className="size-3.5" /> {shareCopied ? "✓" : formatCount(shares)}
          </button>
          <button
            type="button"
            title="Remix this game"
            aria-label={`Remix ${game.title}`}
            {...stopTilePress}
            onClick={(event) => {
              event.stopPropagation();
              remix();
            }}
            className="flex min-w-0 items-center gap-1 rounded-lg bg-fuchsia-100 px-2 py-1 text-[10px] font-black text-fuchsia-600 transition hover:bg-fuchsia-500 hover:text-white"
          >
            <Repeat2 className="size-3.5" /> Remix
          </button>
        </div>
      </div>
      {game.templateId && (
        <ShareGameModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          gameId={game.templateId}
          title={game.title}
          category={game.category}
          thumbnailUrl={game.thumbnailUrl}
          onShared={setShares}
        />
      )}
    </div>
  );
}

function Panel({
  title,
  action,
  onActionClick,
  children,
}: {
  title: string;
  action?: string;
  onActionClick?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border-2 border-fuchsia-200/80 bg-white/80 p-5 text-violet-950 shadow-[0_10px_24px_rgba(124,58,237,0.14),inset_0_1px_10px_rgba(255,255,255,0.9)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-black">{title}</h2>
        {action && (
          <button onClick={onActionClick} className="flex items-center text-xs text-primary">
            {action}
            <ArrowRight className="ml-1.5 size-4" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-md bg-background/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`size-5 ${color}`} />
      </div>
      <strong className="mt-2.5 block text-2xl">{value}</strong>
    </div>
  );
}
