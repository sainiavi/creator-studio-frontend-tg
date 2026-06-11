import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowRight,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gamepad2,
  Globe2,
  Pencil,
  Play,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { gameTemplates } from "@/lib/templates";
import { templateToGame, getThumbnailUrl, resolveGameThumbnail } from "@/lib/studio-meta";
import type { Game } from "@/lib/games-data";
import { useStudioContext } from "@/context/StudioContext";
import { api } from "@/lib/api";

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
const featured: Game[] = [
  {
    title: "Neon Sudoku",
    category: "Puzzle",
    plays: "New",
    emoji: "S",
    gradient: "violet",
    creator: "@0g-agent",
    thumbnailUrl: getThumbnailUrl("neon-sudoku"),
    templateId: "neon-sudoku",
  },
  {
    title: "Simple Agent Game",
    category: "Agent Arcade",
    plays: "New",
    emoji: "A",
    gradient: "cyan",
    creator: "@0g-agent",
    thumbnailUrl: getThumbnailUrl("simple-agent-game"),
    templateId: "simple-agent-game",
  },
  ...library,
];

const activity = [
  { icon: CircleDollarSign, color: "text-neon-green", text: "Neon Drift earned $120", time: "2h" },
  { icon: Bot, color: "text-neon-cyan", text: "RacerBot v2 deployed", time: "4h" },
  { icon: Play, color: "text-neon-violet", text: "PixelKnight played AI Arena", time: "6h" },
  { icon: TrendingUp, color: "text-neon-pink", text: "Cyber Runner reached 1K plays", time: "1d" },
  { icon: Zap, color: "text-neon-violet", text: "Sudoku Master unlocked 'Speed Demon' badge", time: "2d" },
  { icon: Gamepad2, color: "text-neon-green", text: "New high score on Space Shooter: 24.5K pts", time: "3d" },
  { icon: Rocket, color: "text-neon-pink", text: "Bubble Reef published to IPFS", time: "4d" },
];

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
  const [, setIsSearching] = useState(false);

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
  const [prompt, setPrompt] = useState(
    "Create a cyberpunk racing game with AI drivers and neon city rewards.",
  );

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
          thumbnailUrl: resolveGameThumbnail(g),
          templateId: g.id ?? g.templateId,
          prompt: g.customization?.prompt || "",
        })),
    [createdGames],
  );

  // Real view counts drive the Trending order: most viewed first.
  const [viewsMap, setViewsMap] = useState<Record<string, number>>({});
  const [communityGames, setCommunityGames] = useState<Game[]>([]);
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
        const games: any[] = res.data?.games ?? [];
        setCommunityGames(
          games
            .filter((g: any) => g?.title)
            .map((g: any, index: number) => ({
              title: g.title,
              category: g.category ?? "Game",
              plays: "New",
              emoji: "🎮",
              gradient: (index % 2 === 0 ? "violet" : "cyan") as "violet" | "cyan",
              creator: g.creatorId?.startsWith("0x")
                ? `${g.creatorId.slice(0, 6)}…${g.creatorId.slice(-4)}`
                : "community",
              thumbnailUrl: resolveGameThumbnail(g),
              templateId: g.id ?? g.templateId,
            })),
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
    const latest = [...featured].sort((first, second) => {
      if (first.plays === "New" && second.plays !== "New") return -1;
      if (second.plays === "New" && first.plays !== "New") return 1;
      return featured.indexOf(second) - featured.indexOf(first);
    });
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
      ...(myCreations.length > 0 ? [{ title: "My Creations", games: myCreations }] : []),
      { title: "Trending", games: trending },
      { title: "Latest", games: latest },
      { title: "Players' Choice", games: playersChoice },
      { title: "Favourite Games", games: favorites },
      ...categories.map((category) => ({
        title: category,
        games: featured.filter((game) => game.category === category),
      })),
    ];
  }, [myCreations, viewsMap, communityGames]);

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

  const create = () => {
    studio.setPrompt(prompt);
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
            <Zap className="size-4 text-neon-violet" /> 1,250
          </div>
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
                  placeholder="Describe your game..."
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

          {visibleShelves.slice(0, 3).map((shelf) => (
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
        </main>

        <aside className="space-y-3">
          <Panel title="Creator Dashboard">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Games Created" value="24" icon={Gamepad2} color="text-neon-violet" />
              <Metric label="Total Plays" value="128.4K" icon={Play} color="text-neon-cyan" />
              <Metric
                label="Revenue"
                value="$2,845"
                icon={CircleDollarSign}
                color="text-neon-green"
              />
              <Metric label="AI Agents" value="18" icon={Bot} color="text-neon-pink" />
            </div>
            <div className="mt-2 flex items-end justify-between rounded-md bg-background/50 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Active Players</p>
                <strong className="mt-1 block text-2xl">4.3K</strong>
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
            <div className="divide-y divide-border/40">
              {featured.slice(0, 4).map((game, index) => (
                <button
                  key={game.title}
                  onClick={() =>
                    game.templateId &&
                    navigate({ to: "/play/$gameId", params: { gameId: game.templateId } })
                  }
                  className="flex w-full items-center gap-4 py-4 text-left hover:bg-white/[0.02]"
                >
                  <img src={game.thumbnailUrl} alt="" className="size-12 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{game.title}</strong>
                    <span className="text-xs text-muted-foreground">
                      Updated {index + 1}h ago
                    </span>
                  </span>
                  <span className="text-xs text-neon-green">
                    {index % 2 ? "Building" : "Published"}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate({ to: "/create" })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              <Sparkles className="size-4" /> Create New Game
            </button>
          </Panel>

          <Panel title="Recent Activity">
            <div className="divide-y divide-border/40">
              {activity.map(({ icon: Icon, color, text, time }) => (
                <div key={text} className="flex items-center gap-3 py-4">
                  <Icon className={`size-5 shrink-0 ${color}`} />
                  <p className="min-w-0 flex-1 text-xs text-muted-foreground">{text}</p>
                  <span className="text-[10px] text-muted-foreground/60">{time}</span>
                </div>
              ))}
            </div>
          </Panel>
        </aside>

        <div className="min-w-0 space-y-3 xl:col-span-2">
          {visibleShelves.slice(3).map((shelf) => (
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

function GameTile({ game, onOpen, onDelete, onEdit }: { game: Game; onOpen: () => void; onDelete?: () => void; onEdit?: () => void }) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
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
      className="group w-full min-w-0 overflow-hidden rounded-md border border-border/50 bg-background/40 text-left transition hover:border-primary/50"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={game.thumbnailUrl}
          alt=""
          draggable={false}
          onError={(event) => {
            const img = event.currentTarget;
            if (img.dataset.fallback) return;
            img.dataset.fallback = "1";
            img.src = FALLBACK_COVER;
          }}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent" />
        {onEdit && (
          <button
            title={`Edit ${game.title}`}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            className="absolute left-1.5 top-1.5 z-10 grid size-6 place-items-center rounded-md bg-black/60 text-white/80 opacity-0 transition group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            title={`Delete ${game.title}`}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              if (window.confirm(`Delete "${game.title}"? This cannot be undone.`)) onDelete();
            }}
            className="absolute right-1.5 top-1.5 z-10 grid size-6 place-items-center rounded-md bg-black/60 text-white/80 opacity-0 transition group-hover:opacity-100 hover:bg-red-600 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-[11px] font-bold">{game.title}</p>
        <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
          <span className="truncate">{game.category}</span>
          <span className="shrink-0">{game.plays}</span>
        </div>
      </div>
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
