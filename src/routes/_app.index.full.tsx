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
  Gamepad2,
  Globe2,
  Heart,
  Loader2,
  MessageCircle,
  Mountain,
  Pencil,
  Play,
  Puzzle,
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
import { fetchGamesPage, mapApiGameToGame } from "@/lib/api/games";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { VIEWS_TOP_LIMIT } from "@/lib/pagination";
import type { Game } from "@/lib/games-data";
import { fetchCreatorScoreLeaderboard, type CreatorScoreEntry } from "@/lib/api/leaderboards";
import rankOneAvatar from "@/assets/leaderboard-rank-1.webp";
import rankTwoAvatar from "@/assets/leaderboard-rank-2.webp";
import rankThreeAvatar from "@/assets/leaderboard-rank-3.webp";
import categoryArcadeIcon from "@/assets/categoryArcade.webp";
import categoryPuzzleIcon from "@/assets/categoryPuzzle.webp";
import categorySportsIcon from "@/assets/categorySports.webp";
import categoryAdventureIcon from "@/assets/categoryAdventure.png";
import categoryActionIcon from "@/assets/categoryAction.webp";
import categoryMultiplayerIcon from "@/assets/categoryMultiplayer.png";
import categoryRPGIcon from "@/assets/categoryRPG.png";
import categoryStrategyIcon from "@/assets/categoryStrategy.webp";
import categoryMoreIcon from "@/assets/categoryMore.png";
import defaultCreatorAvatar from "@/assets/navProfile.webp";
import { useStudioContext } from "@/context/StudioContext";
import { api } from "@/lib/api";
import {
  fetchCreatorStats,
  fetchNotifications,
  fetchPointSummary,
  fetchRecentActivities,
  markNotificationsRead,
  type CreatorStats,
  type NotificationItem,
  type UserActivity,
} from "@/lib/api/social";
import { MobileHomeHero } from "@/components/studio/MobileHomeHero";
import { useCreateChatFlow } from "@/hooks/useCreateChatFlow";
import { GamePosterCard, type GamePosterSize } from "@/components/studio/GamePosterCard";
import { KultLogo } from "@/components/studio/KultLogo";
import { TonWalletSignInButton } from "@/components/studio/TonWalletSignInButton";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUserId } from "@/lib/identity";

// Full home page — loaded by _app.index.tsx.
// Keep shelves / categories / creators as fixed grids (no horizontal carousels).
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

// The fixed category chips on the mobile home ("Browse by Category").
const browseCategories: {
  name: string;
  icon: ComponentType<{ className?: string }>;
  image?: string;
  iconColor: string;
  glow: string;
  gradient: string;
}[] = [
  {
    name: "Arcade",
    icon: Gamepad2,
    image: categoryArcadeIcon,
    iconColor: "text-violet-400",
    glow: "shadow-[0_0_18px_rgba(167,139,250,0.35)]",
    gradient: "from-violet-300 via-violet-500 to-purple-700",
  },
  {
    name: "Puzzle",
    icon: Puzzle,
    image: categoryPuzzleIcon,
    iconColor: "text-lime-400",
    glow: "shadow-[0_0_18px_rgba(163,230,53,0.35)]",
    gradient: "from-lime-200 via-lime-400 to-green-600",
  },
  {
    name: "Sports",
    icon: Volleyball,
    image: categorySportsIcon,
    iconColor: "text-orange-400",
    glow: "shadow-[0_0_18px_rgba(251,146,60,0.35)]",
    gradient: "from-orange-200 via-orange-400 to-red-600",
  },
  {
    name: "Action",
    icon: Swords,
    image: categoryActionIcon,
    iconColor: "text-amber-300",
    glow: "shadow-[0_0_18px_rgba(252,211,77,0.35)]",
    gradient: "from-amber-200 via-amber-400 to-orange-600",
  },
  {
    name: "Strategy",
    icon: Trophy,
    image: categoryStrategyIcon,
    iconColor: "text-sky-400",
    glow: "shadow-[0_0_18px_rgba(56,189,248,0.35)]",
    gradient: "from-sky-200 via-sky-400 to-blue-600",
  },
  {
    name: "Adventure",
    icon: Mountain,
    image: categoryAdventureIcon,
    iconColor: "text-teal-300",
    glow: "shadow-[0_0_18px_rgba(94,234,212,0.35)]",
    gradient: "from-teal-200 via-teal-400 to-emerald-600",
  },
  {
    name: "RPG",
    icon: Shield,
    image: categoryRPGIcon,
    iconColor: "text-fuchsia-400",
    glow: "shadow-[0_0_18px_rgba(232,121,249,0.35)]",
    gradient: "from-fuchsia-200 via-fuchsia-400 to-purple-700",
  },
  {
    name: "Multiplayer",
    icon: Users,
    image: categoryMultiplayerIcon,
    iconColor: "text-rose-300",
    glow: "shadow-[0_0_18px_rgba(251,113,133,0.35)]",
    gradient: "from-rose-200 via-rose-400 to-pink-600",
  },
];

const browseCategoryPreviewCount = 5;

type BrowseCategoryTile = (typeof browseCategories)[number] & { isMore?: false };
type BrowseMoreTile = {
  name: "More";
  icon: ComponentType<{ className?: string }>;
  image: string;
  iconColor: string;
  glow: string;
  gradient: string;
  isMore: true;
};

const browseMoreTile: BrowseMoreTile = {
  name: "More",
  icon: Gamepad2,
  image: categoryMoreIcon,
  iconColor: "text-cyan-300",
  glow: "",
  gradient: "",
  isMore: true,
};

const homeFeedTabs = ["For You", "Trending", "New", ...browseCategories.map((c) => c.name)];

function shortAddress(value: string | undefined) {
  if (!value) return "";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
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

function uniqueGames(games: Game[]) {
  return games.filter(
    (game, index, collection) =>
      collection.findIndex((candidate) => candidate.templateId === game.templateId) === index,
  );
}

export function Home() {
  const navigate = useNavigate();
  const { studio, createdGames, removeCreatedGame } = useStudioContext();
  const createChat = useCreateChatFlow({
    onReady: (prompt) => {
      sessionStorage.setItem("kult-create-prompt", prompt);
      studio.setPrompt(prompt);
      navigate({ to: "/create" });
    },
    onPromptChange: (prompt) => studio.setPrompt(prompt),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [kultPoints, setKultPoints] = useState(0);
  const [kpLevel, setKpLevel] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileFeedTab, setMobileFeedTab] = useState("For You");
  const [showAllBrowseCategories, setShowAllBrowseCategories] = useState(false);
  const browseTiles = useMemo((): Array<BrowseCategoryTile | BrowseMoreTile> => {
    if (showAllBrowseCategories) {
      return browseCategories.map((category) => ({ ...category, isMore: false as const }));
    }
    const tiles: Array<BrowseCategoryTile | BrowseMoreTile> = browseCategories
      .slice(0, browseCategoryPreviewCount)
      .map((category) => ({ ...category, isMore: false as const }));
    if (browseCategories.length > browseCategoryPreviewCount) {
      tiles.push(browseMoreTile);
    }
    return tiles;
  }, [showAllBrowseCategories]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [recentEventsOpen, setRecentEventsOpen] = useState(false);

  const formatStat = useCallback((value: number | undefined) => {
    const n = value ?? 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }, []);

  const [activities, setActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    const userId = getCurrentUserId();
    fetchRecentActivities(50)
      .then((items) => setActivities(items))
      .catch(() => setActivities([]));
    if (!userId) {
      setCreatorStats(null);
      setNotifications([]);
      return;
    }
    fetchCreatorStats(userId)
      .then(setCreatorStats)
      .catch(() => {
        setCreatorStats(null);
      });
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
    if (!userId) {
      setNotifications([]);
      return;
    }
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
        .get("/games/list", { params: { limit: 100, offset: 0 } })
        .then((res) => {
          const normalizedQuery = query.toLowerCase();
          const games = (res.data?.games ?? []) as Record<string, unknown>[];
          const mapped = games
            .filter((game) => game?.title)
            .map(mapApiGameToGame)
            .filter((game) =>
              [game.title, game.category, game.creator, game.prompt ?? ""].some((value) =>
                value.toLowerCase().includes(normalizedQuery),
              ),
            )
            .slice(0, 20);
          setSearchResults(mapped);
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);
  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;
    fetchPointSummary(userId)
      .then((summary) => {
        setKultPoints(summary.kultPoints ?? summary.lifetimePoints ?? 0);
        setKpLevel(summary.level?.level ?? 1);
      })
      .catch(() => {});
  }, []);

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
  const [gamesLoading, setGamesLoading] = useState(true);

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
    setGamesLoading(true);
    void loadGamesPage(0, false)
      .catch(() => {
        setCommunityGames([]);
        setHasMoreGames(false);
      })
      .finally(() => setGamesLoading(false));
  }, [loadGamesPage]);

  const loadMoreGames = useCallback(() => {
    if (!hasMoreGames || loadingMoreGames) return;
    setLoadingMoreGames(true);
    void loadGamesPage(gamesOffset, true)
      .catch(() => {})
      .finally(() => setLoadingMoreGames(false));
  }, [gamesOffset, hasMoreGames, loadGamesPage, loadingMoreGames]);

  const gamesLoadMoreRef = useInfiniteScroll(loadMoreGames, hasMoreGames && !searchQuery.trim());

  const latestGames = useMemo(
    () =>
      [...communityGames].sort(
        (first, second) =>
          (Date.parse(second.createdAt ?? "") || 0) - (Date.parse(first.createdAt ?? "") || 0),
      ),
    [communityGames],
  );

  const realGames = useMemo(
    () => uniqueGames(communityGames.map(withHomeCategory)),
    [communityGames],
  );
  const homeRowCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...browseCategories.map((category) => category.name),
          ...realGames.map((game) => game.category).filter(Boolean),
        ]),
      ),
    [realGames],
  );

  const shelves = useMemo(() => {
    const realViews = (game: Game) => viewsMap[game.templateId ?? ""] ?? 0;
    const withRealPlays = (game: Game): Game => {
      const v = realViews(game);
      if (v <= 0) return game;
      return { ...game, plays: v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v) };
    };
    // Home shelves are driven only by the /games/list API response.
    const trending = [...realGames]
      .filter((game, i, all) => all.findIndex((x) => x.templateId === game.templateId) === i)
      .sort((first, second) => realViews(second) - realViews(first))
      .map(withRealPlays);
    const latest = uniqueGames(latestGames.map(withHomeCategory)).map(withRealPlays);
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
  }, [realGames, viewsMap, latestGames]);

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

  const trendingNow = useMemo(
    () => shelves.find((shelf) => shelf.title === "Trending")?.games ?? [],
    [shelves],
  );

  const newReleases = useMemo(
    () => shelves.find((shelf) => shelf.title === "Latest")?.games ?? [],
    [shelves],
  );

  const hasAnyGames = communityGames.length > 0;
  const gamesEmptyMessage = "No games found. Check back soon or create the first one!";

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
    <div className="relative min-h-screen text-violet-950">
      <header className="sticky top-0 z-40 box-border flex min-h-[56px] w-[100dvw] max-w-[100dvw] items-center justify-between gap-3 overflow-hidden border-b border-fuchsia-300/20 bg-[#0b0419]/90 px-3 py-2.5 text-white shadow-[0_10px_30px_rgba(8,4,20,0.5),0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl min-[1190px]:mx-3 min-[1190px]:mt-3 min-[1190px]:min-h-16 min-[1190px]:w-auto min-[1190px]:max-w-none min-[1190px]:rounded-[1.5rem] min-[1190px]:border min-[1190px]:border-fuchsia-200/45 min-[1190px]:bg-[#100528]/88 min-[1190px]:px-6 min-[1190px]:py-3 min-[1190px]:shadow-[0_10px_34px_rgba(65,24,138,0.45),0_0_24px_rgba(217,70,239,0.25),inset_0_1px_12px_rgba(255,255,255,0.1)]">
        {mobileSearchOpen ? (
          <div className="flex w-full items-center gap-2 min-[1190px]:hidden">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-fuchsia-300/50 bg-white/10 px-3 shadow-[inset_0_1px_8px_rgba(255,255,255,0.12)]">
              <Search className="size-4 shrink-0 text-violet-100" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search games, categories, creators..."
                aria-label="Search games"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-200/70"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery("");
              }}
              aria-label="Close search"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition active:scale-95"
            >
              <X className="size-4 stroke-[1.75]" />
            </button>
          </div>
        ) : (
          <>
            <div className="relative z-20 flex min-w-0 shrink-0 items-center min-[1190px]:flex-1 min-[1190px]:gap-4">
              <KultLogo className="h-8 w-auto max-w-[118px] object-contain object-left min-[1190px]:h-10 min-[1190px]:max-w-[148px]" />
              <p className="hidden shrink-0 text-sm font-semibold text-violet-100 min-[1190px]:block">
                <span className="font-black text-white"></span>
              </p>
              <label
                onClick={() => navigate({ to: "/search" })}
                className="hidden h-10 w-full max-w-md cursor-pointer items-center gap-2 rounded-xl border border-fuchsia-200/30 bg-white/10 px-3 shadow-[inset_0_1px_8px_rgba(255,255,255,0.12)] transition focus-within:border-fuchsia-200 min-[1190px]:flex"
              >
                <Search className="size-4 shrink-0 text-violet-100" />
                <input
                  type="search"
                  value=""
                  readOnly
                  onFocus={() => navigate({ to: "/search" })}
                  placeholder="Search games, categories, creators..."
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-200/70"
                />
              </label>
            </div>
            <div className="relative z-10 flex shrink-0 items-center justify-end gap-2 min-[1190px]:gap-2.5">
              <TonWalletSignInButton responsive compact />
              <button
                type="button"
                onClick={() => navigate({ to: "/search" })}
                aria-label="Search games"
                className="grid size-9 shrink-0 place-items-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition active:scale-95 focus-within:border-fuchsia-300/60 min-[1190px]:hidden"
              >
                <Search className="size-4 shrink-0 stroke-[1.75]" />
              </button>
              <button
                type="button"
                onClick={() => void openNotifications()}
                title="Open notifications"
                aria-label="Open notifications"
                className="relative grid size-9 shrink-0 place-items-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition active:scale-95 hover:border-fuchsia-300/50 sm:size-9"
              >
                <Bell className="size-4 stroke-[1.75]" />
                {notifications.some((notification) => !notification.read) && (
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </button>
              <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-[linear-gradient(135deg,#7c3aed,#d946ef)] px-2.5 text-[11px] font-black tabular-nums text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_14px_rgba(217,70,239,0.45)] min-[1190px]:gap-2 min-[1190px]:px-3 min-[1190px]:text-xs">
                <Zap
                  className="size-3.5 shrink-0 fill-white text-white min-[1190px]:size-4"
                  strokeWidth={1.75}
                />
                <span className="min-[1190px]:hidden">{formatCount(kultPoints)}</span>
                <span className="hidden min-[1190px]:inline">
                  Level {kpLevel} · {formatCount(kultPoints)} KP
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/profile" })}
                title="Open profile"
                aria-label="Open profile"
                className="hidden size-9 place-items-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] font-display text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition hover:border-fuchsia-300/50 min-[1190px]:grid"
              >
                K
              </button>
            </div>
          </>
        )}
      </header>

      <MobileHomeHero
        value={createChat.chatInput}
        onChange={createChat.setChatInput}
        onSubmit={createChat.submitComposerPrompt}
        onCategoryPick={createChat.sendChat}
        onWorldPick={createChat.sendChat}
        messages={createChat.messages}
        chatStage={createChat.chatStage}
        onQuickReply={createChat.sendChat}
        isThinking={createChat.isThinking}
      />

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

      <div className="relative z-10 grid gap-3 px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-1 min-[1190px]:pb-6 min-[1190px]:pt-0 xl:grid-cols-[minmax(0,1fr)_310px]">
        <main className="min-w-0 space-y-3">
          <section className="min-[1190px]:hidden">
            <div className="mx-auto w-full max-w-2xl space-y-3 px-1 min-[480px]:max-w-[920px] min-[480px]:px-3">
              {searchQuery.trim() ? (
                isSearching && (visibleShelves[0]?.games.length ?? 0) === 0 ? (
                  <GamesFeedSkeleton />
                ) : (
                  <FeedGrid
                    games={visibleShelves[0]?.games ?? []}
                    onOpen={openGame}
                    emptyText={`No games match "${searchQuery}".`}
                  />
                )
              ) : null}

              {!searchQuery.trim() && (
                <>
                  <CategoryGameRows
                    categories={homeRowCategories}
                    onOpen={openGame}
                  />
                  {topCreators.length > 0 && (
                    <TopCreatorsRow
                      creators={topCreators}
                      onViewAll={() => navigate({ to: "/leaderboard" })}
                    />
                  )}
                </>
              )}
            </div>
          </section>

          <div className="hidden space-y-3 min-[1190px]:block">
            {gamesLoading ? (
              <GamesShelfSkeleton count={2} />
            ) : visibleShelves.length === 0 ? (
              <p className="rounded-[1.35rem] border-2 border-fuchsia-200 bg-white/80 py-12 text-center text-sm font-semibold text-violet-700 shadow-[0_10px_24px_rgba(124,58,237,0.16)] backdrop-blur">
                {gamesEmptyMessage}
              </p>
            ) : (
              visibleShelves.slice(0, 2).map((shelf) => (
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
              ))
            )}
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
          {!gamesLoading &&
            visibleShelves.slice(2).map((shelf) => (
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
          {(hasMoreGames || loadingMoreGames) && !searchQuery.trim() && hasAnyGames && (
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

  const basisClass =
    cardsPerRow === 4
      ? "min-w-0 shrink-0 grow-0 basis-[44%] sm:basis-[32%] md:basis-[24%] lg:basis-[calc(25%-6px)] 2xl:basis-[calc(25%-6px)]"
      : "min-w-0 shrink-0 grow-0 basis-[44%] sm:basis-[32%] md:basis-[24%] lg:basis-[calc(20%-7px)] 2xl:basis-[calc(16.666%-7px)]";

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
            {games.map((game, index) => (
              <div key={`${game.title}-${index}`} className={basisClass}>
                <GameTile
                  game={game}
                  onOpen={() => openGame(game)}
                  onDelete={onDeleteGame ? () => onDeleteGame(game) : undefined}
                  onEdit={onEditGame ? () => onEditGame(game) : undefined}
                  size="standard"
                  metaTheme="light"
                />
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
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {games.map((game, index) => (
                  <GameTile
                    key={`${game.title}-grid-${index}`}
                    game={game}
                    onOpen={() => openGame(game)}
                    onDelete={onDeleteGame ? () => onDeleteGame(game) : undefined}
                    onEdit={onEditGame ? () => onEditGame(game) : undefined}
                    size="compact"
                    metaTheme="light"
                  />
                ))}
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
    <div className="flex w-full flex-col gap-2">
      <Skeleton className="aspect-[4/5] w-full rounded-[1.25rem]" />
      <div className="flex items-center gap-2 px-0.5">
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="h-3 w-16 rounded-full" />
      </div>
    </div>
  );
}

function GamesShelfSkeleton({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, section) => (
        <section
          key={section}
          className="rounded-[1.35rem] border-2 border-fuchsia-200 bg-white/80 p-3 shadow-[0_10px_24px_rgba(124,58,237,0.16)] backdrop-blur"
        >
          <Skeleton className="mb-3 h-5 w-32 rounded-lg" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="min-w-0 shrink-0 grow-0 basis-[calc(25%-6px)]">
                <PlaceholderTile />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function GamesFeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, section) => (
        <div key={section}>
          <Skeleton className="mb-3 h-7 w-40 rounded-lg" />
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <PlaceholderTile key={index} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const HOME_CATEGORY_PAGE_SIZE = 6;

function compactCreatorName(value: string | undefined) {
  const name = value?.trim() || "Player";
  return name.length > 10 ? `${name.slice(0, 5)}…${name.slice(-5)}` : name;
}

type CategoryRowVariant = "portrait" | "square" | "wide" | "slim";

const categoryRowLayout: Record<
  CategoryRowVariant,
  { width: string; aspect: string }
> = {
  portrait: {
    width: "w-[39%] min-[480px]:w-[22%] min-[760px]:w-[16%]",
    aspect: "aspect-[3/4]",
  },
  square: {
    width: "w-[39%] min-[480px]:w-[22%] min-[760px]:w-[16%]",
    aspect: "aspect-square",
  },
  wide: {
    width: "w-[64%] min-[480px]:w-[38%] min-[760px]:w-[24%]",
    aspect: "aspect-[4/3]",
  },
  slim: {
    width: "w-[31.5%] min-[480px]:w-[22%] min-[760px]:w-[16%]",
    aspect: "aspect-[2/3]",
  },
};

function CategoryMiniCard({
  game,
  onOpen,
  variant,
}: {
  game: Game;
  onOpen: () => void;
  variant: CategoryRowVariant;
}) {
  const creator = compactCreatorName(game.creator);
  const layout = categoryRowLayout[variant];
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    setThumbnailLoaded(false);
    setThumbnailFailed(false);
  }, [game.thumbnailUrl]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group shrink-0 text-left ${layout.width}`}
      title={game.creator}
    >
      <span
        className={`relative block overflow-hidden rounded-[14px] border border-white bg-[#160b2e] shadow-[0_6px_16px_rgba(30,7,65,0.26)] ${layout.aspect}`}
      >
        {!thumbnailLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-violet-950/55" />
        )}
        {game.thumbnailUrl && !thumbnailFailed ? (
          <img
            src={game.thumbnailUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300 group-active:scale-[0.98] ${
              thumbnailLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={(event) => {
              if (event.currentTarget.naturalWidth > 0) setThumbnailLoaded(true);
            }}
            onError={() => {
              setThumbnailLoaded(false);
              setThumbnailFailed(true);
            }}
          />
        ) : null}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {game.plays && game.plays !== "New" && (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur">
            <Play className="size-2.5 fill-current" />
            {game.plays}
          </span>
        )}
      </span>
      <span className="mt-1 flex min-w-0 items-center gap-1 px-0.5">
        <img
          src={defaultCreatorAvatar}
          alt=""
          className="size-[18px] shrink-0 rounded-full object-cover ring-1 ring-white"
        />
        <span className="min-w-0 truncate text-[10px] font-bold text-violet-950 min-[480px]:text-xs">
          {creator}
        </span>
      </span>
    </button>
  );
}

function CategoryGameRow({
  category,
  onOpen,
  variant,
}: {
  category: string;
  onOpen: (game: Game) => void;
  variant: CategoryRowVariant;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      const page = await fetchGamesPage(nextOffset, HOME_CATEGORY_PAGE_SIZE, category);
      setGames((current) => uniqueGames(append ? [...current, ...page.games] : page.games));
      setOffset(nextOffset + page.games.length);
      setHasMore(page.hasMore && page.games.length > 0);
    },
    [category],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchGamesPage(0, HOME_CATEGORY_PAGE_SIZE, category)
      .then((page) => {
        if (cancelled) return;
        setGames(uniqueGames(page.games));
        setOffset(page.games.length);
        setHasMore(page.hasMore && page.games.length > 0);
      })
      .catch(() => {
        if (!cancelled) {
          setGames([]);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return;
    setLoadingMore(true);
    void loadPage(offset, true)
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  }, [hasMore, loadPage, loading, loadingMore, offset]);

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const remaining = viewport.scrollWidth - viewport.scrollLeft - viewport.clientWidth;
    if (remaining < viewport.clientWidth * 0.7) loadMore();
  };

  if (!loading && games.length === 0) return null;
  const layout = categoryRowLayout[variant];

  return (
    <section>
      <h2 className="mb-1 font-display text-lg font-black leading-none tracking-tight text-violet-950">
        {category}
      </h2>
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-1.5 min-[480px]:gap-2">
          {loading
            ? Array.from({ length: HOME_CATEGORY_PAGE_SIZE }).map((_, index) => (
                <div
                  key={index}
                  className={`shrink-0 ${layout.width}`}
                >
                  <Skeleton className={`rounded-[14px] ${layout.aspect}`} />
                  <Skeleton className="mt-1.5 h-3.5 w-4/5 rounded-full" />
                </div>
              ))
            : games.map((game, index) => (
                <CategoryMiniCard
                  key={`${game.templateId ?? game.title}-${index}`}
                  game={game}
                  onOpen={() => onOpen(game)}
                  variant={variant}
                />
              ))}
          {loadingMore && (
            <div className="grid w-16 shrink-0 place-items-center">
              <Loader2 className="size-6 animate-spin text-fuchsia-500" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryGameRows({
  categories,
  onOpen,
}: {
  categories: string[];
  onOpen: (game: Game) => void;
}) {
  return (
    <div className="space-y-2">
      {categories.map((category, index) => {
        const position = index % 5;
        const variant: CategoryRowVariant =
          position === 0
            ? "portrait"
            : position === 1 || position === 2
              ? "square"
              : position === 3
                ? "wide"
                : "slim";
        return (
          <CategoryGameRow
            key={category}
            category={category}
            onOpen={onOpen}
            variant={variant}
          />
        );
      })}
    </div>
  );
}

function MobileShelf({
  title,
  games,
  onViewAll,
  onOpen,
  cardSize: _cardSize = "standard",
  emptyText = "No games found.",
}: {
  title: string;
  games: Game[];
  onViewAll: () => void;
  onOpen: (game: Game) => void;
  cardSize?: GamePosterSize;
  emptyText?: string;
}) {
  const visible = games.slice(0, 4);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="min-w-0 font-display text-xl font-black tracking-tight text-violet-950">
          {title}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-violet-800/90 transition hover:text-violet-950"
        >
          View all <ChevronRight className="size-4" />
        </button>
      </div>
      {games.length === 0 ? (
        <p className="py-8 text-center text-sm font-semibold text-violet-700">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 min-[480px]:grid-cols-4 min-[480px]:gap-3">
          {visible.map((game, index) => (
            <GameTile
              key={`${game.templateId ?? game.title}-${index}`}
              game={game}
              onOpen={() => onOpen(game)}
              size="compact"
              metaTheme="light"
            />
          ))}
        </div>
      )}
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
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[480px]:grid-cols-4 min-[480px]:gap-3">
      {games.map((game, index) => (
        <GameTile
          key={`${game.templateId ?? game.title}-${index}`}
          game={game}
          onOpen={() => onOpen(game)}
          size="compact"
          metaTheme="light"
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
  const visible = creators.slice(0, 4);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-black tracking-tight text-violet-950">
          Top Creators
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-violet-800/90 transition hover:text-violet-950"
        >
          View all <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="overflow-hidden rounded-[17px] border border-white bg-[#160b2e] shadow-[0_10px_28px_rgba(8,4,20,0.45),0_0_0_1px_rgba(168,85,247,0.1)]">
        {visible.map((entry, index) => {
          const avatar = rankAvatars[entry.rank];
          const label = shortAddress(entry.creatorId) || shortAddress(entry.name) || entry.name;
          return (
            <button
              key={entry.id ?? entry.creatorId}
              type="button"
              onClick={onViewAll}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-white transition active:bg-white/10 hover:bg-white/5 ${
                index > 0 ? "border-t border-white/10" : ""
              }`}
            >
              <div className="relative shrink-0">
                <span className="block size-10 overflow-hidden rounded-full border-2 border-white/20 bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_4px_12px_rgba(124,58,237,0.35)]">
                  {avatar ? (
                    <img src={avatar} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-sm font-black text-white">
                      {(entry.name || entry.creatorId).replace(/^0x/, "").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span
                  className={`absolute -bottom-0.5 -left-0.5 grid size-5 place-items-center rounded-full border-2 border-[#160b2e] text-[10px] font-black shadow-sm ${rankBadgeClass(entry.rank)}`}
                >
                  {entry.rank}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black leading-tight text-white">{label}</p>
                <p className="mt-0.5 text-[11px] font-bold text-fuchsia-300">
                  {formatCount(entry.creatorScore)} CS
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-violet-300/50" />
            </button>
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
  size = "standard",
  metaTheme = "light",
}: {
  game: Game;
  onOpen: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  size?: GamePosterSize;
  metaTheme?: "light" | "dark";
}) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const tileRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={tileRef}
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
    >
      <GamePosterCard
        game={game}
        onClick={onOpen}
        onEdit={onEdit}
        onDelete={
          onDelete
            ? () => {
                if (window.confirm(`Delete "${game.title}"? This cannot be undone.`)) onDelete();
              }
            : undefined
        }
        size={size}
        metaTheme={metaTheme}
      />
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
