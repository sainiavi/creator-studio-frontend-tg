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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Globe2,
  Heart,
  MessageCircle,
  Pencil,
  Play,
  Repeat2,
  Rocket,
  Search,
  Share2,
  Sparkles,
  Trophy,
  TrendingUp,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { gameTemplates } from "@/lib/templates";
import { templateToGame, getThumbnailUrl, resolveGameThumbnail } from "@/lib/studio-meta";
import type { Game } from "@/lib/games-data";
import { useStudioContext } from "@/context/StudioContext";
import { api } from "@/lib/api";
import {
  fetchCreatorStats,
  fetchNotifications,
  fetchPointSummary,
  fetchSocialStats,
  fetchUserActivities,
  markNotificationsRead,
  toggleLike,
  type CreatorStats,
  type NotificationItem,
  type UserActivity,
} from "@/lib/api/social";
import { ShareGameModal } from "@/components/studio/ShareGameModal";
import { getCurrentUserId } from "@/lib/identity";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Home - Creator Studio" },
      { name: "description", content: "Create, publish, and grow playable games with AI." },
    ],
  }),
  component: Home,
});

const library = gameTemplates.map((template, index) => templateToGame(template, index));
const featured: Game[] = [...library];

// Maps a real backend activity type to the icon/color used in the feed.
const activityStyle: Record<UserActivity["activityType"], { icon: ComponentType<{ className?: string }>; color: string }> = {
  like: { icon: Heart, color: "text-neon-pink" },
  favorite: { icon: Sparkles, color: "text-neon-violet" },
  share: { icon: Share2, color: "text-neon-green" },
  comment: { icon: MessageCircle, color: "text-neon-cyan" },
  create: { icon: WandSparkles, color: "text-neon-violet" },
  play: { icon: Play, color: "text-neon-cyan" },
  publish: { icon: Rocket, color: "text-neon-pink" },
  major_edit: { icon: Pencil, color: "text-neon-green" },
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

const preferredCategories = ["Action", "Arcade", "Racing", "Puzzle"];
const categoryPriority = ["Action", "Arcade", "Racing"];
const placeholderSlots = Array.from({ length: 6 }, (_, index) => index);

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

function Home() {
  const navigate = useNavigate();
  const { studio, createdGames, removeCreatedGame } = useStudioContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [kultPoints, setKultPoints] = useState(0);
  const [kpLevel, setKpLevel] = useState(1);
  const [, setIsSearching] = useState(false);
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileFeedTab, setMobileFeedTab] = useState("For You");

  const formatStat = useCallback((value: number | undefined) => {
    const n = value ?? 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }, []);

  const [activities, setActivities] = useState<UserActivity[]>([]);

  useEffect(() => {
    const userId = getCurrentUserId();
    fetchCreatorStats(userId).then(setCreatorStats).catch(() => {
      setCreatorStats(null);
    });
    fetchUserActivities(userId)
      .then((items) => setActivities(items.slice(0, 4)))
      .catch(() => setActivities([]));
    const refreshNotifications = () => {
      fetchNotifications(userId).then((data) => setNotifications(data.notifications)).catch(() => {
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
            plays: g.views ? (g.views >= 1000 ? `${(g.views / 1000).toFixed(1)}K` : String(g.views)) : "New",
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
  const [prompt, setPrompt] = useState("");

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
        .filter((g: any, i: number, all: any[]) => !g?.id || all.findIndex((x: any) => x?.id === g.id) === i)
        .map((g: any, index: number) => ({
          title: g.title,
          category: g.category ?? "Game",
          plays: g.views ? (g.views >= 1000 ? `${(g.views / 1000).toFixed(1)}K` : String(g.views)) : "New",
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
        .filter((g: any, i: number, all: any[]) => !g?.id || all.findIndex((x: any) => x?.id === g.id) === i)
        .sort(
          (a: any, b: any) =>
            (Date.parse(b?.updatedAt ?? b?.createdAt ?? "") || 0) -
            (Date.parse(a?.updatedAt ?? a?.createdAt ?? "") || 0),
        )
        .slice(0, 4),
    [createdGames],
  );

  // Real view counts drive the Trending order: most viewed first.
  const [viewsMap, setViewsMap] = useState<Record<string, number>>({});
  const [communityGames, setCommunityGames] = useState<Game[]>([]);
  // Real published games, newest first — drives the Latest shelf.
  const [latestGames, setLatestGames] = useState<Game[]>([]);
  useEffect(() => {
    api
      .get("/social/views-top", { params: { limit: 500 } })
      .then((res) => {
        const map: Record<string, number> = {};
        for (const g of res.data?.games ?? []) map[g.gameId] = g.views;
        setViewsMap(map);
      })
      .catch(() => {});
    // Trending is platform-wide: every creator's games compete by views.
    api
      .get("/games/list", { params: { limit: 100 } })
      .then((res) => {
        const games: any[] = (res.data?.games ?? []).filter((g: any) => g?.title);
        const toGame = (g: any, index: number): Game => ({
          title: g.title,
          category: g.category ?? "Game",
          plays: "New",
          emoji: "🎮",
          gradient: (index % 2 === 0 ? "violet" : "cyan") as "violet" | "cyan",
          creator: g.creatorId?.startsWith("0x")
            ? `${g.creatorId.slice(0, 6)}…${g.creatorId.slice(-4)}`
            : "community",
          creatorId: g.creatorId,
          thumbnailUrl: resolveGameThumbnail(g),
          templateId: g.id ?? g.templateId,
          likes: Number(g.points?.likes ?? 0),
          shares: Number(g.points?.shares ?? 0),
          creatorScore: Number(g.creatorScore ?? g.points?.total ?? 0),
          remixOf: g.remixOf,
        });
        setCommunityGames(games.map(toGame));
        setLatestGames(
          [...games]
            .sort(
              (a: any, b: any) =>
                (Date.parse(b?.createdAt ?? "") || 0) - (Date.parse(a?.createdAt ?? "") || 0),
            )
            .map(toGame),
        );
      })
      .catch(() => {});
  }, []);

  const shelves = useMemo(() => {
    const realViews = (game: Game) => viewsMap[game.templateId ?? ""] ?? 0;
    const withRealPlays = (game: Game): Game => {
      const v = realViews(game);
      if (v <= 0) return game;
      return { ...game, plays: v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v) };
    };
    // Most-viewed first; untouched games keep their showcase order after them.
    const trending = [...featured, ...myCreations, ...communityGames]
      .filter((game, i, all) => all.findIndex((x) => x.templateId === game.templateId) === i)
      .sort((first, second) => realViews(second) - realViews(first))
      .map(withRealPlays);
    // Newest real games first (actual createdAt order from the backend);
    // showcase templates only pad the shelf after them.
    const latest = uniqueGames([...latestGames, ...featured]).map(withRealPlays);
    const playersChoice = uniqueGames([
      ...preferredCategories.flatMap((category) =>
        trending.filter((game) => game.category === category),
      ),
      ...trending,
    ]);
    const favoriteIds = [
      "neon-sudoku",
      "simple-agent-game",
      "cyber-runner",
      "ai-arena",
      "racing",
      "runner",
      "match3",
      "memory",
      "space-shooter",
      "quiz",
    ];
    const favorites = uniqueGames([
      ...favoriteIds
        .map((id) => featured.find((game) => game.templateId === id))
        .filter((game): game is Game => Boolean(game)),
      ...trending,
    ]).slice(0, 14);

    const categories = Array.from(new Set(featured.map((game) => game.category))).sort(
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
        games: featured.filter((game) => game.category === category),
      })),
    ];
  }, [myCreations, viewsMap, communityGames, latestGames]);

  const visibleShelves = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return shelves;

    // Local matches across all shelves as an instant starting point
    const localMatches = shelves
      .flatMap((shelf) => shelf.games)
      .filter((game, index, self) =>
        self.findIndex((g) => g.templateId === game.templateId || g.title === game.title) === index
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

    return [
      { title: `Search Results for “${searchQuery}”`, games: allResults }
    ];
  }, [searchQuery, shelves, searchResults]);

  const mobileFeedTabs = useMemo(() => {
    const byTitle = new Map(visibleShelves.map((shelf) => [shelf.title, shelf.games]));
    // For You ranks by real like counts: most liked first.
    const forYou = [...(byTitle.get("Players' Choice") ?? byTitle.get("Trending") ?? [])].sort(
      (first, second) => (second.likes ?? 0) - (first.likes ?? 0),
    );
    const baseTabs = [
      { label: "For You", games: forYou },
      { label: "🔥 Trending", games: byTitle.get("Trending") ?? [] },
      { label: "New", games: byTitle.get("Latest") ?? [] },
      { label: "Following", games: myCreations },
    ];
    const categoryTabs = visibleShelves
      .filter((shelf) => !["My Creations", "Trending", "Latest", "Players' Choice", "Favourite Games"].includes(shelf.title))
      .map((shelf) => ({ label: shelf.title, games: shelf.games }));
    return [...baseTabs, ...categoryTabs].filter((tab) => tab.games.length > 0);
  }, [visibleShelves, myCreations]);

  const selectedMobileFeed = mobileFeedTabs.find((tab) => tab.label === mobileFeedTab) ?? mobileFeedTabs[0];

  useEffect(() => {
    if (mobileFeedTabs.length > 0 && !mobileFeedTabs.some((tab) => tab.label === mobileFeedTab)) {
      setMobileFeedTab(mobileFeedTabs[0].label);
    }
  }, [mobileFeedTab, mobileFeedTabs]);

  const create = () => {
    const value = prompt.trim();
    studio.setPrompt(value);
    // Hand the typed idea to the create page, which drops it into its chat input.
    if (value) sessionStorage.setItem("kult-create-prompt", value);
    navigate({ to: "/create" });
  };

  return (
    <div className="min-h-screen bg-[oklch(0.105_0.018_282)]">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border/50 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <p className="hidden shrink-0 text-sm text-muted-foreground sm:block">
            Welcome back, <span className="font-semibold text-foreground">KULT Creator</span>
          </p>
          <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-md border border-border/60 bg-card/70 px-3 transition focus-within:border-primary/60">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search games, categories, creators..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/70 px-3 py-2 text-xs font-bold">
            <Zap className="size-4 text-neon-violet" /> Level {kpLevel} · {formatCount(kultPoints)} KP
          </div>
          <button
            type="button"
            onClick={() => void openNotifications()}
            title="Open notifications"
            aria-label="Open notifications"
            className="relative grid size-9 place-items-center rounded-full border border-border/60 bg-card/70 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <Bell className="size-4" />
            {notifications.some((notification) => !notification.read) && (
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/profile" })}
            title="Open profile"
            aria-label="Open profile"
            className="grid size-9 place-items-center rounded-full bg-primary/20 font-display text-sm font-bold text-primary transition hover:bg-primary/30"
          >
            K
          </button>
        </div>
      </header>

      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="max-h-[82vh] overflow-y-auto border-border/60 bg-card sm:max-w-xl">
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
            {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_310px]">
        <main className="min-w-0 space-y-3">
          <section className="relative min-h-[380px] overflow-hidden rounded-lg border border-border/60 bg-card">
            <img
              src={getThumbnailUrl("cyber-runner")}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.12_0.025_282)_0%,oklch(0.12_0.025_282/0.94)_46%,oklch(0.12_0.025_282/0.36)_100%)]" />
            <div className="relative z-10 flex min-h-[380px] items-end gap-6 p-6 lg:p-8">
              <div className="flex min-w-0 max-w-[620px] flex-1 flex-col justify-center self-center">
              <p className="label-mono mb-2 text-[10px] text-neon-cyan">AI game creation suite</p>
              <h1 className="max-w-lg font-display text-3xl font-black leading-tight sm:text-4xl">
                CREATE ANY GAME <span className="text-gradient">WITH AI</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Turn an idea into a playable build in minutes.
              </p>
              <div className="mt-5 rounded-lg border border-primary/35 bg-[oklch(0.13_0.025_282/0.92)] p-3 shadow-neon">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="h-20 w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
                  placeholder="Create your own game, share it with friends & earn rewards ✨ Describe your idea..."
                  maxLength={500}
                />
                <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
                  <span className="text-[10px] text-muted-foreground">{prompt.length}/500</span>
                  <button
                    onClick={create}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground transition hover:brightness-110"
                  >
                    <WandSparkles className="size-4" /> GENERATE GAME
                  </button>
                </div>
              </div>
              </div>
              <div className="hidden w-52 shrink-0 space-y-3 lg:block">
                <Feature icon={Sparkles} title="1-Click Generate" copy="Prompt to playable game" />
                <Feature icon={Bot} title="AI Agent Integration" copy="Intelligent NPCs" />
                <Feature icon={Globe2} title="Deploy to Browser" copy="Play instantly, anywhere" />
                <Feature icon={Rocket} title="Publish & Earn" copy="Share your creations" />
              </div>
            </div>
          </section>

          {selectedMobileFeed && (
            <section className="min-[1190px]:hidden rounded-lg border border-border/60 bg-card/55 p-3">
              <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max items-center gap-7 border-b border-border/40">
                  {mobileFeedTabs.map((tab) => {
                    const selected = selectedMobileFeed.label === tab.label;
                    return (
                      <button
                        key={tab.label}
                        type="button"
                        onClick={() => setMobileFeedTab(tab.label)}
                        className={`relative pb-3 text-base font-black transition ${
                          selected ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {tab.label}
                        {selected && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3">
                {selectedMobileFeed.games.slice(0, 12).map((game, index) => (
                  <GameTile
                    key={`${selectedMobileFeed.label}-${game.title}-${index}`}
                    game={game}
                    onOpen={() => {
                      if (game.templateId) navigate({ to: "/play/$gameId", params: { gameId: game.templateId } });
                    }}
                    onDelete={
                      selectedMobileFeed.label === "Following"
                        ? () => { if (game.templateId) void removeCreatedGame(game.templateId); }
                        : undefined
                    }
                    onEdit={
                      selectedMobileFeed.label === "Following"
                        ? () => { if (game.templateId) navigate({ to: "/edit/$gameId", params: { gameId: game.templateId } }); }
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          )}

          <div className="hidden space-y-3 min-[1190px]:block">
            {visibleShelves.slice(0, 2).map((shelf) => (
              <GameShelf
                key={shelf.title}
                title={shelf.title}
                games={shelf.games}
                cardsPerRow={4}
                onDeleteGame={
                  shelf.title === "My Creations"
                    ? (game) => { if (game.templateId) void removeCreatedGame(game.templateId); }
                    : undefined
                }
                onEditGame={
                  shelf.title === "My Creations"
                    ? (game) => { if (game.templateId) navigate({ to: "/edit/$gameId", params: { gameId: game.templateId } }); }
                    : undefined
                }
              />
            ))}
          </div>
        </main>

        <aside className="space-y-3">
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
                <strong className="mt-1 block text-2xl">{formatStat(creatorStats?.followers)}</strong>
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

          <Panel title="My Projects" action="View all" onActionClick={() => navigate({ to: "/profile" })}>
            {myProjects.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">
                No projects yet — create your first game and it shows up here.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {myProjects.map((g: any) => {
                  const gameId = g.id ?? g.templateId;
                  const building =
                    studio.activeBuild?.phase === "building" && studio.activeBuild?.game?.id === g.id;
                  const published = g.publish?.published === true;
                  const updated = relativeTime(g.updatedAt ?? g.createdAt ?? "");
                  return (
                    <button
                      key={gameId ?? g.title}
                      onClick={() =>
                        gameId && navigate({ to: "/play/$gameId", params: { gameId } })
                      }
                      className="flex w-full items-center gap-4 py-4 text-left hover:bg-white/[0.02]"
                    >
                      <img src={resolveGameThumbnail(g)} alt="" className="size-12 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm">{g.title}</strong>
                        <span className="text-xs text-muted-foreground">
                          {updated === "now" ? "Updated just now" : `Updated ${updated} ago`}
                        </span>
                      </span>
                      <span
                        className={`text-xs ${
                          building ? "text-amber-300" : published ? "text-neon-green" : "text-muted-foreground"
                        }`}
                      >
                        {building ? "Building" : published ? "Published" : "Draft"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate({ to: "/create" })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              <Sparkles className="size-4" /> Create New Game
            </button>
          </Panel>

          <Panel title="Recent Activity">
            {activities.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground">
                No activity yet — play, like, or publish a game and it shows up here.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {activities.map((item) => {
                  const style = activityStyle[item.activityType] ?? { icon: Gamepad2, color: "text-neon-cyan" };
                  const Icon = style.icon;
                  return (
                    <div key={item._id} className="flex items-center gap-3 py-2.5">
                      <Icon className={`size-4 shrink-0 ${style.color}`} />
                      <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={item.details}>
                        {item.details}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground/60">{relativeTime(item.timestamp)}</span>
                    </div>
                  );
                })}
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
              onDeleteGame={
                shelf.title === "My Creations"
                  ? (game) => { if (game.templateId) void removeCreatedGame(game.templateId); }
                  : undefined
              }
              onEditGame={
                shelf.title === "My Creations"
                  ? (game) => { if (game.templateId) navigate({ to: "/edit/$gameId", params: { gameId: game.templateId } }); }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  copy,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/15">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-[11px] font-bold">{title}</p>
        <p className="text-[9px] text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}

function GameShelf({ title, games, cardsPerRow, onDeleteGame, onEditGame }: { title: string; games: Game[]; cardsPerRow?: number; onDeleteGame?: (game: Game) => void; onEditGame?: (game: Game) => void }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
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

  const basisClass = cardsPerRow === 4
    ? "min-w-0 shrink-0 grow-0 basis-[72%] sm:basis-[40%] md:basis-[31%] lg:basis-[calc(25%-6px)] 2xl:basis-[calc(25%-6px)]"
    : "min-w-0 shrink-0 grow-0 basis-[72%] sm:basis-[40%] md:basis-[31%] lg:basis-[calc(20%-7px)] 2xl:basis-[calc(16.666%-7px)]";

  return (
    <>
      <section className="rounded-lg border border-border/60 bg-card/55 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">{title}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={scrollPrev}
              title="Previous games"
              className="grid size-7 place-items-center rounded-md border border-border/60 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={scrollNext}
              title="Next games"
              className="grid size-7 place-items-center rounded-md border border-border/60 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              onClick={() => setShowAll(true)}
              className="ml-2 flex items-center gap-1 text-[10px] text-primary"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAll(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`All ${title}`}
            className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-border bg-[oklch(0.12_0.02_282)] shadow-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {games.length} playable games
                </p>
              </div>
              <button
                onClick={() => setShowAll(false)}
                title="Close"
                className="grid size-9 place-items-center rounded-md border border-border/60 text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
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
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function PlaceholderTile() {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-md border border-dashed border-border/70 bg-background/25 text-left">
      <div className="relative aspect-square overflow-hidden bg-[linear-gradient(135deg,oklch(0.2_0.035_282),oklch(0.12_0.02_282))]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,transparent,oklch(0.72_0.27_340/0.18),transparent)]" />
        <div className="absolute inset-4 rounded border border-border/50" />
      </div>
      <div className="p-2">
        <p className="truncate text-[11px] font-bold text-muted-foreground">Coming Soon</p>
        <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground/70">
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

function GameTile({ game, onOpen, onDelete, onEdit }: { game: Game; onOpen: () => void; onDelete?: () => void; onEdit?: () => void }) {
  const navigate = useNavigate();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(game.likes ?? 0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(game.shares ?? 0);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [creatorMeta, setCreatorMeta] = useState<{ followers: number; remixes: number } | null>(null);

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
      className="group w-full min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-neon"
    >
      <div className="relative aspect-square overflow-hidden">
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
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />
        <span className="label-mono absolute left-2 top-2 rounded-md bg-black/45 px-2 py-1 text-[9px] text-white backdrop-blur">
          {game.category}
        </span>
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
          <Play className="size-3" /> {game.plays}
        </span>
        {onEdit && (
          <button
            title={`Edit ${game.title}`}
            {...stopTilePress}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="absolute left-2 top-9 z-10 grid size-7 place-items-center rounded-md bg-black/60 text-white/80 opacity-0 transition group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
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
            className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-md bg-black/60 text-white/80 opacity-0 transition group-hover:opacity-100 hover:bg-red-600 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display text-xs font-bold">{game.title}</p>
          <span className="label-mono shrink-0 text-[8px] text-muted-foreground">{game.creator}</span>
        </div>
        {creatorMeta && (
          <div className="mt-1.5 flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1" title={`${game.creator} has ${creatorMeta.followers} followers`}>
              <Users className="size-3 text-neon-cyan" /> {formatCount(creatorMeta.followers)} followers
            </span>
            <span className="flex items-center gap-1" title={`${game.creator}'s games were remixed ${creatorMeta.remixes} times`}>
              <Repeat2 className="size-3 text-neon-violet" /> {formatCount(creatorMeta.remixes)} remixes
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
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
              liked ? "text-rose-400" : "text-muted-foreground hover:text-rose-400"
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
            className="flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-muted-foreground transition hover:text-neon-cyan"
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
            className="flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold text-muted-foreground transition hover:text-neon-green"
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
            className="flex min-w-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
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
    <section className="rounded-lg border border-border/60 bg-card/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
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
