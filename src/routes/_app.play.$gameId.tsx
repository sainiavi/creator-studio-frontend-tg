import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Heart,
  Loader2,
  MessageCircle,
  MessageSquareWarning,
  MoreVertical,
  Play,
  Plus,
  Send,
  Shuffle,
  Maximize2,
  Minimize2,
  Trash2,
  UserPlus,
  X,
  Trophy,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGameTemplates } from "@/hooks/useGameTemplates";
import { GamePreview } from "@/components/studio/GamePreview";
import { Html5Preview } from "@/components/studio/Html5Preview";
import { SimpleAgentGame } from "@/components/studio/SimpleAgentGame";
import { NeonSudokuGame } from "@/components/studio/NeonSudokuGame";
import { PlayPageSkeleton } from "@/components/studio/PageSkeletons";
import { engineOf, templateEmoji, getThumbnailUrl, resolveGameThumbnail } from "@/lib/studio-meta";
import { localPackage } from "@/hooks/useCreatorStudio";
import { gradientClass } from "@/lib/games-data";
import { gradientForId, templateToGame } from "@/lib/studio-meta";
import { useSocial } from "@/hooks/useSocial";
import { useFollow } from "@/hooks/useFollow";
import { getCurrentUserId } from "@/lib/identity";
import { recordQualifiedPlay, recordView } from "@/lib/api/social";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useStudioContext } from "@/context/StudioContext";
import { api } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/api/leaderboards";
import type { SharePlatform } from "@/lib/api/social";
import { qualifyReferral } from "@/lib/api/referral";
import {
  clearPlayReturnPath,
  readPlayReturnPath,
} from "@/lib/playNavigation";

export const Route = createFileRoute("/_app/play/$gameId")({
  pendingComponent: PlayPageSkeleton,
  head: ({ params }) => ({
    meta: [
      { title: `${params.gameId} - Creator Studio` },
      { name: "description", content: "Play this game instantly from the social feed." },
    ],
  }),
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

// ═══════════════════════════════════════════════════════════════════════════
//  Leaderboard Logic & Side Panel
// ═══════════════════════════════════════════════════════════════════════════

function LeaderboardButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex min-w-12 flex-col items-center gap-1.5 text-white transition-transform active:scale-90 lg:min-w-12"
    >
      <span className="grid size-11 place-items-center rounded-full bg-white/10 transition lg:size-10 group-hover:bg-white/18">
        <Trophy className="size-5 text-amber-400" />
      </span>
      <span className="text-[10px] font-black lg:text-[10px]">Rank</span>
    </button>
  );
}

function LeaderboardPanel({
  template,
  entries,
  loading,
  onClose,
}: {
  template: any;
  entries: LeaderboardEntry[];
  loading: boolean;
  onClose: () => void;
}) {
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];
  const listPlayers = entries.slice(3);

  return (
    <div className="flex flex-col h-full overflow-hidden text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Trophy className="size-5 text-amber-400" />
          <div>
            <h3 className="text-lg font-black tracking-tight">Leaderboard</h3>
            <p className="text-[10px] font-semibold text-white/40">{template.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
        >
          <X className="size-5" />
        </button>
      </div>

      {loading && (
        <div className="grid flex-1 place-items-center text-sm font-bold text-white/45">
          Loading scores...
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <Trophy className="mx-auto mb-4 size-12 text-amber-400/60" />
            <h4 className="text-lg font-black text-white">No scores yet</h4>
            <p className="mt-2 text-sm leading-6 text-white/50">
              This game has its own leaderboard. Scores submitted for other games will not appear
              here.
            </p>
          </div>
        </div>
      )}

      {!loading && top1 && (
        <div className="flex items-end justify-center gap-3 py-8 border-b border-white/5 shrink-0 select-none">
          {/* Rank 2 */}
          {top2 && (
            <div className="flex flex-col items-center w-20 text-center">
              <div className="relative">
                <div className="size-14 rounded-full border border-zinc-400/40 bg-zinc-800/80 p-0.5 overflow-hidden shadow-lg">
                  <div className="size-full rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex items-center justify-center text-lg font-bold">
                    🥈
                  </div>
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-5 rounded-full bg-zinc-400 text-black flex items-center justify-center text-[10px] font-black border-2 border-zinc-950">
                  2
                </div>
              </div>
              <span className="text-[10px] font-black text-white/90 truncate w-full mt-3 block">
                {top2.username}
              </span>
              <span className="text-[10px] font-black text-amber-400/80 mt-0.5 block">
                {formatCount(top2.score)}
              </span>
            </div>
          )}

          {/* Rank 1 */}
          <div className="flex flex-col items-center w-24 text-center z-10">
            <div className="relative -top-2">
              <div className="size-18 rounded-full border-2 border-amber-400 bg-zinc-800/80 p-0.5 overflow-hidden shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                <div className="size-full rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-xl font-bold">
                  👑
                </div>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-5.5 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-black border-2 border-zinc-950">
                1
              </div>
            </div>
            <span className="text-xs font-black text-white truncate w-full mt-1 block">
              {top1.username}
            </span>
            <span className="text-xs font-black text-amber-400 mt-0.5 block">
              {formatCount(top1.score)}
            </span>
          </div>

          {/* Rank 3 */}
          {top3 && (
            <div className="flex flex-col items-center w-20 text-center">
              <div className="relative">
                <div className="size-14 rounded-full border border-amber-700/40 bg-zinc-800/80 p-0.5 overflow-hidden shadow-lg">
                  <div className="size-full rounded-full bg-gradient-to-tr from-amber-800 to-amber-600 flex items-center justify-center text-lg font-bold">
                    🥉
                  </div>
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-5 rounded-full bg-amber-700 text-black flex items-center justify-center text-[10px] font-black border-2 border-zinc-950">
                  3
                </div>
              </div>
              <span className="text-[10px] font-black text-white/90 truncate w-full mt-3 block">
                {top3.username}
              </span>
              <span className="text-[10px] font-black text-amber-400/80 mt-0.5 block">
                {formatCount(top3.score)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Ranks list */}
      {!loading && entries.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
          {listPlayers.map((row) => (
            <div
              key={row.rank}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 hover:bg-white/8 transition duration-150"
            >
              {/* Rank badge */}
              <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-xs font-black text-white/50">
                {row.rank}
              </div>

              {/* Avatar block */}
              <div className="size-8 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                {row.username.charAt(0).toUpperCase()}
              </div>

              {/* Player details */}
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs text-white truncate block">{row.username}</span>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <span className="font-mono font-black text-xs text-white/95">
                  {formatCount(row.score)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayFeed() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const { setSidebarCollapsed, studio, createdGames, refreshCreatedGames } = useStudioContext();
  const { gameTemplates, themePresets, loading: templatesLoading } = useGameTemplates();
  const isSimpleAgentGame = gameId === "simple-agent-game";
  const isNeonSudoku = gameId === "neon-sudoku";

  const isTemplateRoute = gameTemplates.some((template: any) => template.id === gameId);
  const generatedPackageMatches =
    !isTemplateRoute &&
    Boolean(studio.generatedPackage?.id) &&
    (studio.generatedPackage?.id === gameId ||
     studio.generatedPackage?.templateId === gameId ||
     (gameId === "pure-agent" && studio.generatedPackage?.templateId === "pure-agent"));
  // A created game opened by its own id (from My Creations / profile). Without
  // this lookup, unknown ids silently fell back to gameTemplates[0] and played
  // the wrong game instead of the creation's generated build.
  const localCustomGame = !generatedPackageMatches
    ? createdGames.find((cg: any) => cg?.id === gameId)
    : undefined;
  const [publicGame, setPublicGame] = useState<any>(null);
  const [publicLoadState, setPublicLoadState] = useState<"idle" | "loading" | "loaded" | "not-found">(
    "idle",
  );
  const customGame = localCustomGame ?? (publicGame?.id === gameId ? publicGame : undefined);

  // Shared links resolve through the public-by-ID endpoint. It returns only
  // explicitly published games, so drafts cannot be opened by guessing an id.
  useEffect(() => {
    if (!gameId || isSimpleAgentGame || isNeonSudoku || isTemplateRoute || generatedPackageMatches || localCustomGame) {
      setPublicLoadState("idle");
      return;
    }
    let cancelled = false;
    setPublicGame(null);
    setPublicLoadState("loading");
    api
      .get(`/games/${encodeURIComponent(gameId)}`)
      .then((res) => {
        if (cancelled) return;
        const found = res.data?.game;
        if (found?.id === gameId) {
          setPublicGame(found);
          setPublicLoadState("loaded");
        } else setPublicLoadState("not-found");
      })
      .catch(() => {
        if (!cancelled) setPublicLoadState("not-found");
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, isSimpleAgentGame, isNeonSudoku, isTemplateRoute, generatedPackageMatches, localCustomGame]);

  // The AI build finishes minutes after the game record exists. While this
  // created game has no code yet, poll the backend so the finished build
  // swaps in without requiring a manual refresh.
  const awaitingBuild = Boolean(customGame) && !customGame?.refinement?.generatedCode;
  useEffect(() => {
    if (!awaitingBuild) return;
    const interval = setInterval(() => {
      void refreshCreatedGames();
    }, 20000);
    return () => clearInterval(interval);
  }, [awaitingBuild, refreshCreatedGames]);

  const index = Math.max(
    0,
    gameTemplates.findIndex((t: any) => t.id === gameId),
  );
  const baseTemplate = gameTemplates[index] ?? gameTemplates[0] ?? null;
  const template = isNeonSudoku
    ? {
        ...(baseTemplate ?? {}),
        id: "neon-sudoku",
        name: "Neon Sudoku",
        category: "Puzzle",
        mechanic: "Complete the 9x9 number grid without repeating digits.",
        controls: "Mouse, touch, keyboard numbers, or R to restart.",
      }
    : isSimpleAgentGame
      ? {
          ...(baseTemplate ?? {}),
          id: "simple-agent-game",
          name: "Simple Agent Game",
          category: "Agent Arcade",
          mechanic: "Click the glowing target as many times as possible in 20 seconds.",
          controls: "Mouse, touch, or R to restart.",
        }
      : generatedPackageMatches && studio.generatedPackage
        ? {
            id: studio.generatedPackage.templateId || "pure-agent",
            name: studio.generatedPackage.title || "AI Custom Game",
            category: studio.generatedPackage.category || "Casual",
            mechanic: studio.generatedPackage.gameplay?.mechanic || "custom gameplay mechanics",
            controls: studio.generatedPackage.gameplay?.controls || "controls",
            engine: studio.generatedPackage.build?.renderer === "construct" ? "construct" : "threejs"
          }
        : customGame
          ? {
              id: customGame.id || customGame.templateId || "pure-agent",
              name: customGame.title || "AI Custom Game",
              category: customGame.category || "Casual",
              mechanic: customGame.gameplay?.mechanic || "custom gameplay mechanics",
              controls: customGame.gameplay?.controls || "controls",
              // Generated builds run on the canvas renderer regardless of the
              // template family they were routed from.
              engine: "threejs"
            }
          : isTemplateRoute
            ? baseTemplate
            : null;

  const game = isNeonSudoku
    ? {
        ...templateToGame(template, index),
        title: template.name,
        category: template.category,
        emoji: "🔢",
      }
    : isSimpleAgentGame
      ? {
          ...templateToGame(template, index),
          title: template.name,
          category: template.category,
          emoji: "🎯",
        }
      : generatedPackageMatches && studio.generatedPackage
        ? {
            title: studio.generatedPackage.title,
            category: studio.generatedPackage.category,
            plays: "1.2K",
            emoji: "🎮",
            gradient: "from-purple-900 to-indigo-950",
            creator: "0G AI Agent",
            thumbnailUrl: (studio.generatedPackage as any).thumbnailUrl || "/thumbnails/chess-cover.png",
            templateId: studio.generatedPackage.id || studio.generatedPackage.templateId,
          }
        : customGame
          ? {
              title: customGame.title,
              category: customGame.category ?? "Game",
              plays: "New",
              emoji: "🎮",
              gradient: "from-purple-900 to-indigo-950",
              creator: "you",
              thumbnailUrl: resolveGameThumbnail(customGame),
              templateId: customGame.id ?? customGame.templateId,
            }
          : templateToGame(template, index);

  const engine = engineOf(template);
  const gameTags = Array.from(
    new Set([
      game.category,
      engine === "construct" ? "HTML5" : "Canvas",
      "AI Generated",
    ]),
  );
  const profile = creatorProfiles[index % creatorProfiles.length];
  const pkg = generatedPackageMatches
    ? studio.generatedPackage
    : customGame ??
      (template
        ? localPackage(
            template,
            {
              prompt: `${template.name} playable feed session`,
              theme: "neon",
              difficulty: "normal",
              customization: "light",
              extra: "none",
            },
            themePresets,
          )
        : null);
  const isCustomCreation = Boolean(generatedPackageMatches || customGame);
  const isShareable = !isCustomCreation || pkg?.publish?.published === true;
  const baseRemixCount = Number((customGame as any)?.remixes ?? (pkg as any)?.remixes ?? 0);
  const [remixCount, setRemixCount] = useState(baseRemixCount);
  const social = useSocial(gameId);
  // Real follow state: target the game's creator (template games fall back to
  // a stable pseudo-creator id derived from the displayed creator name).
  const creatorId =
    (pkg as any)?.creatorId ?? (customGame as any)?.creatorId ?? `creator:${game.creator ?? "studio"}`;
  const follow = useFollow(creatorId);
  const isFollowing = follow.following;
  const setIsFollowing = (_next?: boolean) => {
    if (follow.isSelf) return;
    void follow.toggle();
  };
  // Count a real play once per game per browser session.
  const [viewCount, setViewCount] = useState<number | null>(null);
  useEffect(() => {
    if (!gameId) return;
    const key = `kult-viewed-${gameId}`;
    const uid = getCurrentUserId();
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    recordView(gameId, uid)
      .then((r) => setViewCount(r.views))
      .catch(() => {});
  }, [gameId]);
  useEffect(() => {
    setRemixCount(baseRemixCount);
  }, [baseRemixCount, gameId]);

  const handleRemix = useCallback(() => {
    const seed = [
      `Remix ${game.title}`,
      (pkg as any)?.gameplay?.mechanic ||
        template?.mechanic ||
        `${template?.category ?? game.category ?? "Arcade"} game`,
      "Keep the core mechanics, physics, controls, and pacing.",
      "Change the theme, characters, visual style, and one gameplay twist.",
    ].join(". ");
    sessionStorage.setItem("kult-remix-prompt", seed);
    setRemixCount((count) => count + 1);
    navigate({ to: "/create" });
  }, [game.category, game.title, navigate, pkg, template?.category, template?.mechanic]);
  if (viewCount != null) game.plays = viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}K` : String(viewCount);
  const isMobile = useIsMobile();
  const leaderboard = useLeaderboard(gameId);
  const { submitScore } = leaderboard;
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const playStartedAt = useRef(Date.now());

  useEffect(() => {
    setIsGameActive(false);
    playStartedAt.current = Date.now();
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    const key = `kult-qualified-play-${gameId}`;
    if (sessionStorage.getItem(key)) return;

    const uid = getCurrentUserId();
    const sessionId = `${gameId}:${uid}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const timer = window.setTimeout(() => {
      const durationSeconds = Math.floor((Date.now() - playStartedAt.current) / 1000);
      recordQualifiedPlay(gameId, { userId: uid, sessionId, durationSeconds })
        .then((result) => {
          if (result.qualified) sessionStorage.setItem(key, "1");
        })
        .catch(() => {});
    }, 30_000);

    return () => window.clearTimeout(timer);
  }, [gameId]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const feedTabs = [
    { label: "For You", gameId: "flappy" },
    { label: "Trending", gameId: "match3" },
    { label: "Friends", gameId: "memory" },
    { label: "New Creations", gameId: "neon-sudoku" },
  ];
  const activeFeed = feedTabs.find((tab) => tab.gameId === gameId)?.label ?? "For You";

  useEffect(() => {
    setSidebarCollapsed(leaderboardOpen);
    return () => {
      setSidebarCollapsed(false);
    };
  }, [leaderboardOpen, setSidebarCollapsed]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
      return;
    }
    await frameRef.current?.requestFullscreen?.();
  };

  const handleScoreSubmit = useCallback(
    async (score: number) => {
      await submitScore(score).catch(() => {});
      const durationSeconds = Math.floor((Date.now() - playStartedAt.current) / 1000);
      const qualificationKey = `kult-referral-qualified-${getCurrentUserId()}`;
      if (durationSeconds > 30 && !localStorage.getItem(qualificationKey)) {
        const result = await qualifyReferral(gameId, durationSeconds).catch(() => null);
        if (result?.qualified || result?.status === "held") {
          localStorage.setItem(qualificationKey, "1");
        }
      }
    },
    [gameId, submitScore],
  );

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isUiHidden = false;
  const startY = useRef(0);
  const cooldownRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);

  const slideDistance = useCallback(
    () => (typeof window !== "undefined" ? Math.min(window.innerHeight * 0.42, 520) : 420),
    [],
  );

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsDragging(false);
    cooldownRef.current = false;
    setIsGameActive(false);
  }, [gameId]);

  const navigateToReelGame = useCallback(
    (nextGameId: string, direction: "next" | "prev") => {
      navigate({
        to: "/play/$gameId",
        params: { gameId: nextGameId },
        replace: true,
        resetScroll: false,
      });
      setDragY(direction === "next" ? slideDistance() * 0.18 : -slideDistance() * 0.18);
      requestAnimationFrame(() => {
        setDragY(0);
        setIsTransitioning(false);
        transitionTimerRef.current = window.setTimeout(() => {
          cooldownRef.current = false;
        }, 280);
      });
    },
    [navigate, slideDistance],
  );

  const handlePlayBack = useCallback(() => {
    const returnTo = readPlayReturnPath();
    if (returnTo) {
      clearPlayReturnPath();
      const [pathname, search = ""] = returnTo.split("?");
      if (search) {
        const params = Object.fromEntries(new URLSearchParams(search));
        navigate({ to: pathname, search: params });
      } else {
        navigate({ to: pathname });
      }
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    navigate({ to: "/" });
  }, [navigate]);

  const trendingIds = useMemo(
    () => [
      "match3",
      "flappy",
      "space-shooter",
      "head-soccer-2026",
      "bubble-shooter",
      "cratch-royale",
    ],
    [],
  );
  const agentIds = useMemo(() => ["simple-agent-game", "ai-arena"], []);
  const friendsIds = useMemo(
    () => [
      "memory",
      "drawing",
      "quiz",
      "race-kings",
      "spin-wheel-royale",
    ],
    [],
  );
  const newCreationsIds = useMemo(
    () => [
      "neon-sudoku",
      "simple-agent-game",
      "chicken-cross",
      "cratch-royale",
      "neon-bounce",
      "plinko-pro",
      "race-kings",
      "spin-wheel-royale",
      "stake-mines",
    ],
    [],
  );

  const getTabGameList = useCallback(
    (tab: string) => {
      if (!gameTemplates.length) return [];
      const neonSudokuTemplate = {
        ...gameTemplates[0],
        id: "neon-sudoku",
        name: "Neon Sudoku",
        category: "Puzzle",
        mechanic: "Complete the 9x9 number grid without repeating digits.",
        controls: "Mouse, touch, keyboard numbers, or R to restart.",
        engine: "canvas",
      };
      const simpleAgentTemplate = {
        ...gameTemplates[0],
        id: "simple-agent-game",
        name: "Simple Agent Game",
        category: "Agent Arcade",
        mechanic: "Click the glowing target as many times as possible in 20 seconds.",
        controls: "Mouse, touch, or R to restart.",
        engine: "canvas",
      };
      const allTemplates = [neonSudokuTemplate, simpleAgentTemplate, ...gameTemplates];
      const templates = allTemplates;
      
      switch (tab) {
        case "Trending":
          return trendingIds.map(id => templates.find((t: any) => t.id === id)).filter(Boolean);
        case "Friends":
          return friendsIds.map(id => templates.find((t: any) => t.id === id)).filter(Boolean);
        case "New Creations":
          return newCreationsIds.map(id => templates.find((t: any) => t.id === id)).filter(Boolean);
        case "For You":
        default:
          return templates;
      }
    },
    [gameTemplates, trendingIds, friendsIds, newCreationsIds],
  );

  const [activeTab, setActiveTab] = useState(() => {
    if (newCreationsIds.includes(gameId)) return "New Creations";
    if (friendsIds.includes(gameId)) return "Friends";
    if (trendingIds.includes(gameId)) return "Trending";
    return "For You";
  });

  useEffect(() => {
    const currentList = getTabGameList(activeTab);
    if (!currentList.some((t: any) => t.id === gameId)) {
      if (newCreationsIds.includes(gameId)) setActiveTab("New Creations");
      else if (friendsIds.includes(gameId)) setActiveTab("Friends");
      else if (trendingIds.includes(gameId)) setActiveTab("Trending");
      else setActiveTab("For You");
    }
  }, [gameId, activeTab, getTabGameList, newCreationsIds, friendsIds, trendingIds]);

  const activeGamesList = useMemo(() => {
    const list = getTabGameList(activeTab) as any[];
    if (template && !list.some((t) => t?.id === gameId)) {
      return [template, ...list];
    }
    return list;
  }, [activeTab, getTabGameList, gameId, template]);

  const handleTabClick = useCallback(
    (tabLabel: string, defaultGameId: string) => {
      setActiveTab(tabLabel);
      navigate({
        to: "/play/$gameId",
        params: { gameId: defaultGameId },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  const triggerNextGame = useCallback(() => {
    if (cooldownRef.current || activeGamesList.length === 0 || isTransitioning) return;
    const indexInList = activeGamesList.findIndex((t: any) => t.id === gameId);
    const currentIndex = indexInList === -1 ? 0 : indexInList;
    const nextIndex = (currentIndex + 1) % activeGamesList.length;
    const nextGame = activeGamesList[nextIndex];
    if (!nextGame || nextGame.id === gameId) return;

    cooldownRef.current = true;
    setIsTransitioning(true);
    setDragY(-slideDistance());

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      navigateToReelGame(nextGame.id, "next");
    }, 260);
  }, [gameId, activeGamesList, isTransitioning, navigateToReelGame, slideDistance]);

  const triggerPrevGame = useCallback(() => {
    if (cooldownRef.current || activeGamesList.length === 0 || isTransitioning) return;
    const indexInList = activeGamesList.findIndex((t: any) => t.id === gameId);
    const currentIndex = indexInList === -1 ? 0 : indexInList;
    const prevIndex = (currentIndex - 1 + activeGamesList.length) % activeGamesList.length;
    const prevGame = activeGamesList[prevIndex];
    if (!prevGame || prevGame.id === gameId) return;

    cooldownRef.current = true;
    setIsTransitioning(true);
    setDragY(slideDistance());

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      navigateToReelGame(prevGame.id, "prev");
    }, 260);
  }, [gameId, activeGamesList, isTransitioning, navigateToReelGame, slideDistance]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("[data-reel-actions]") ||
      (isGameActive && target.closest(".feed-game-frame"))
    ) {
      return;
    }

    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startY.current = clientY;
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || cooldownRef.current || isTransitioning) return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startY.current;
    setDragY(deltaY * 0.72);
    if (Math.abs(deltaY) > 8 && "touches" in e) {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || isTransitioning) return;
    setIsDragging(false);

    if (dragY < -72) {
      triggerNextGame();
      return;
    }
    if (dragY > 72) {
      triggerPrevGame();
      return;
    }
    setDragY(0);
  };

  useEffect(() => {
    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".comments-panel") ||
        target.closest(".leaderboard-panel") ||
        target.closest("[data-reel-actions]") ||
        (isGameActive && target.closest(".feed-game-frame"))
      ) {
        return;
      }

      if (Math.abs(e.deltaY) < 12) return;

      const now = Date.now();
      if (now - lastWheelTime < 520) return;

      e.preventDefault();
      if (e.deltaY > 0) {
        lastWheelTime = now;
        triggerNextGame();
      } else {
        lastWheelTime = now;
        triggerPrevGame();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [triggerNextGame, triggerPrevGame, isGameActive]);

  const socialButtons = (
    <>
      <RemixSidebarButton count={remixCount} onRemix={handleRemix} />
      <LeaderboardButton onClick={() => setLeaderboardOpen(true)} />
      <ShareButton
        count={social.shareCount}
        open={social.shareMenuOpen}
        onToggle={() => social.setShareMenuOpen(!social.shareMenuOpen)}
        onShare={social.handleShare}
        template={template}
        game={game}
        gameId={gameId}
        disabled={!isShareable}
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
      <ActionButton
        icon={isFullscreen ? <Minimize2 className="size-6" /> : <Maximize2 className="size-6" />}
        label={isFullscreen ? "Exit" : "Expand"}
        onClick={toggleFullscreen}
      />
    </>
  );

  const isKnownGame =
    isSimpleAgentGame ||
    isNeonSudoku ||
    generatedPackageMatches ||
    Boolean(customGame) ||
    gameTemplates.some((candidate: any) => candidate.id === gameId);

  // Wait for templates and/or the public game payload before rendering play UI.
  if (templatesLoading && !isSimpleAgentGame && !isNeonSudoku && !customGame && !generatedPackageMatches) {
    return <PlayPageSkeleton />;
  }

  if (!isKnownGame && (publicLoadState === "idle" || publicLoadState === "loading")) {
    return <PlayPageSkeleton />;
  }

  if (!isKnownGame && publicLoadState === "not-found") {
    return (
      <div className="grid h-[100dvh] place-items-center bg-black px-6 text-white">
        <div className="max-w-md text-center">
          <MessageSquareWarning className="mx-auto size-12 text-white/40" />
          <h1 className="mt-5 font-display text-3xl font-black">Game unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            This link does not exist, or the creator has not published the game yet.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black"
          >
            Browse games
          </Link>
        </div>
      </div>
    );
  }

  // Still resolving game metadata — avoid rendering against a null template/pkg.
  if (!template || !pkg) {
    return <PlayPageSkeleton />;
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black touch-none text-white">
      {/* Mobile back */}
      <button
        type="button"
        onClick={handlePlayBack}
        aria-label="Go back"
        className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 grid size-10 place-items-center rounded-full border border-white/20 bg-black/55 text-white shadow-lg backdrop-blur-md transition active:scale-95 lg:hidden"
      >
        <ChevronLeft className="size-6" strokeWidth={2.4} />
      </button>

      {isCustomCreation && !isShareable && (
        <div className="absolute left-1/2 top-3 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border border-amber-300/25 bg-black/80 px-4 py-2 text-xs font-bold text-amber-200 backdrop-blur">
          Draft preview
          <Link
            to="/edit/$gameId"
            params={{ gameId }}
            className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-black"
          >
            Publish
          </Link>
        </div>
      )}
      {/* Navigation Arrows for Desktop (Moved to right) */}
      <div className={`absolute right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4 transition-opacity duration-300 ${isUiHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <button
          type="button"
          onClick={triggerPrevGame}
          className="grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
          aria-label="Previous game"
        >
          <ArrowUp size={24} />
        </button>
        <button
          type="button"
          onClick={triggerNextGame}
          className="grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
          aria-label="Next game"
        >
          <ArrowDown size={24} />
        </button>
      </div>

      {/* (Old Right Sidebar removed, moved to Game Container wrapper) */}

      <main
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        className="absolute inset-0 h-full w-full select-none cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate3d(0, ${dragY}px, 0)`,
          transition: isDragging
            ? "none"
            : "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease",
          opacity: isTransitioning ? 0.94 : 1,
          willChange: isDragging || isTransitioning ? "transform" : "auto",
        }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientClass[gradientForId(String(template?.id ?? gameId))]} opacity-30`}
        />
        <img
          src={game?.thumbnailUrl || getThumbnailUrl(String(template?.id ?? gameId))}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-20 blur-2xl"
        />
        
        {/* Game Container Wrapper */}
        <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-all duration-500 ease-out lg:pb-0 ${leaderboardOpen ? "lg:pr-[420px]" : ""}`}>
          <div className="relative flex items-center justify-center w-full h-full lg:w-auto lg:h-full">
            <div
              ref={frameRef}
              className={`relative feed-game-frame w-full h-full rounded-b-3xl overflow-hidden pointer-events-auto lg:w-[400px] lg:h-full lg:rounded-none lg:shadow-2xl lg:border-x lg:border-white/10 ${
                engine === "construct" ? "feed-game-frame--construct" : "feed-game-frame--canvas"
              } ${leaderboardOpen ? "feed-game-frame--leaderboard-open" : ""}`}
            >
              <div className={`w-full h-full lg:h-[calc(100%-76px)] lg:pointer-events-auto ${!isGameActive ? "pointer-events-none" : ""}`}>
                {isNeonSudoku ? (
                  <NeonSudokuGame onScoreSubmit={handleScoreSubmit} />
                ) : isSimpleAgentGame ? (
                  <SimpleAgentGame onScoreSubmit={handleScoreSubmit} />
                ) : engine === "construct" ? (
                  <Html5Preview templateId={String(template?.id ?? gameId)} />
                ) : (
                  <GamePreview gamePackage={pkg} onScoreSubmit={handleScoreSubmit} />
                )}
              </div>

              {/* Play Button Overlay (Mobile/Tablet only) */}
              {!isGameActive && (
                <div 
                  className="absolute inset-0 z-20 flex lg:hidden items-center justify-center bg-black/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGameActive(true);
                  }}
                >
                  <div className="grid size-20 place-items-center rounded-full bg-white/20 text-white shadow-xl backdrop-blur-md transition-transform active:scale-95 border border-white/30">
                    <Play size={40} className="ml-2 fill-current" />
                  </div>
                </div>
              )}
              {/* Desktop Creator Bar (Bottom of Game Frame) */}
              <div className="absolute bottom-0 left-0 right-0 h-[76px] px-4 bg-zinc-950/90 backdrop-blur-md hidden lg:flex items-center justify-between z-30 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full border border-white/20 bg-black/40 font-display text-sm font-black shadow-lg">
                    {profile.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{profile.name}</p>
                    <p className="text-[10px] text-white/70">Browse their games</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isFullscreen && (
                    <button
                      onClick={toggleFullscreen}
                      className="grid size-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                      title="Exit Fullscreen"
                    >
                      <Minimize2 className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    disabled={follow.isSelf}
                    className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
                    title={follow.isSelf ? "You cannot follow yourself" : undefined}
                  >
                    {follow.isSelf ? "You" : isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Right Actions (Floating next to game frame) */}
            <aside className={`hidden lg:flex flex-col items-center gap-5 ml-6 pb-6 pointer-events-auto transition-opacity duration-300 ${isUiHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
              {socialButtons}
            </aside>
          </div>
        </div>
      </main>

      {/* Mobile reel actions — stacked up from bottom-right */}
      <aside
        data-reel-actions
        className={`absolute bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.25rem))] right-2 z-40 flex flex-col-reverse items-center gap-2.5 lg:hidden transition-opacity duration-300 ${isUiHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <ActionButton
          icon={<MoreVertical className="size-5" />}
          label="More"
          onClick={() => setDetailsModalOpen(true)}
        />
        <ActionButton
          icon={<Trophy className="size-5" />}
          label="Ranks"
          onClick={() => setLeaderboardOpen(true)}
          active={leaderboardOpen}
        />
        <ShareButton
          count={social.shareCount}
          open={social.shareMenuOpen}
          onToggle={() => social.setShareMenuOpen(!social.shareMenuOpen)}
          onShare={social.handleShare}
          template={template}
          game={game}
          gameId={gameId}
          disabled={!isShareable}
        />
        <FavoriteButton
          favorited={social.favorited}
          count={social.favoriteCount}
          onToggle={social.handleFavorite}
          animating={social.favoriteAnimating}
        />
        <ActionButton
          icon={<MessageCircle className="size-5" />}
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
        <div className="relative mb-0.5">
          <div className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/10 font-display text-sm font-black shadow-lg backdrop-blur-md">
            {profile.avatar}
          </div>
          {!follow.isSelf && (
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className="absolute -bottom-1 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-[#a855f7] text-white shadow-md"
              aria-label={isFollowing ? "Unfollow" : "Follow"}
            >
              {isFollowing ? <Check size={11} strokeWidth={3} /> : <Plus size={11} strokeWidth={3} />}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile creator strip (bottom-left, reel style) */}
      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 right-20 z-40 lg:hidden">
        <div className="max-w-[70%]">
          <p className="truncate text-sm font-black text-white drop-shadow">{game.title}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-white/70">
            {profile.name} · {game.category}
          </p>
        </div>
      </div>

      {/* Details Modal */}
      <DetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        template={template}
        profile={profile}
        social={social}
        pkg={pkg}
        generatedPackageMatches={generatedPackageMatches}
        isFollowing={isFollowing}
        setIsFollowing={setIsFollowing}
      />

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

      {leaderboardOpen && (
        <>
          <div
            className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm animate-in fade-in lg:hidden"
            onClick={() => setLeaderboardOpen(false)}
          />
          <div className="fixed z-[70] flex flex-col bg-[#0a0a0f] shadow-2xl transition-all inset-x-0 bottom-0 max-h-[90vh] w-full rounded-t-[2.5rem] animate-in slide-in-from-bottom p-6 pb-8 lg:top-0 lg:bottom-0 lg:right-0 lg:left-auto lg:w-[min(420px,calc(100vw-92px))] lg:max-h-screen lg:rounded-none lg:border-l lg:border-white/10 lg:bg-zinc-950/95 lg:animate-in lg:slide-in-from-right lg:pb-6">
            <div className="mx-auto mb-6 h-1 w-12 shrink-0 rounded-full bg-white/20 lg:hidden" />
            <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <LeaderboardPanel
                template={template}
                entries={leaderboard.entries}
                loading={leaderboard.loading}
                onClose={() => setLeaderboardOpen(false)}
              />
            </div>
          </div>
        </>
      )}
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
      className={`group flex min-w-12 flex-col items-center gap-1.5 text-white transition-transform active:scale-90 lg:min-w-12 ${active ? "text-white/100" : ""}`}
    >
      <span
        className={`grid size-11 place-items-center rounded-full transition lg:size-10 ${
          active ? "bg-white/25 ring-1 ring-white/30" : "bg-white/10 group-hover:bg-white/18"
        }`}
      >
        <div className="scale-75">{icon}</div>
      </span>
      <span className="text-[10px] font-black lg:text-[10px]">{label}</span>
    </button>
  );
}

function FollowSidebarButton({
  following,
  onToggle,
}: {
  following: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`group flex min-w-12 flex-col items-center gap-1.5 transition-transform active:scale-90 lg:min-w-12 ${following ? "text-white/60" : "text-white"}`}
    >
      <span
        className={`grid size-11 place-items-center rounded-full transition duration-300 lg:size-10 ${
          following
            ? "bg-white/10"
            : "bg-gradient-to-tr from-rose-500 to-pink-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
        }`}
      >
        {following ? (
          <Check className="size-5 text-white/80" />
        ) : (
          <UserPlus className="size-5 text-white" />
        )}
      </span>
      <span className="text-[10px] font-black lg:text-[10px]">
        {following ? "Following" : "Follow"}
      </span>
    </button>
  );
}

function RemixSidebarButton({
  count,
  onRemix,
}: {
  count: number;
  onRemix: () => void;
}) {
  return (
    <button
      onClick={onRemix}
      className="group flex min-w-12 flex-col items-center gap-1.5 text-white transition-transform active:scale-90 lg:min-w-12"
    >
      <span className="grid size-11 place-items-center rounded-full bg-gradient-to-tr from-fuchsia-500 to-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.42)] transition duration-300 group-hover:brightness-110 lg:size-10">
        <Shuffle className="size-5 text-white" />
      </span>
      <span className="text-[10px] font-black lg:text-[10px]">
        {formatCount(count)}
      </span>
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
      className="group flex min-w-12 flex-col items-center gap-1.5 transition-transform active:scale-90 lg:min-w-12"
    >
      <span
        className={`grid size-11 place-items-center rounded-full transition lg:size-10 ${
          liked ? "bg-rose-500/30 ring-1 ring-rose-400/50" : "bg-white/10 group-hover:bg-white/18"
        }`}
      >
        <Heart
          className={`size-5 transition-all ${
            liked ? "fill-rose-400 text-rose-400" : "text-white"
          } ${animating ? "scale-125" : "scale-100"}`}
        />
      </span>
      <span
        className={`text-[10px] font-black lg:text-[10px] ${liked ? "text-rose-400" : "text-white"}`}
      >
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
      className="group flex min-w-12 flex-col items-center gap-1.5 transition-transform active:scale-90 lg:min-w-12"
    >
      <span
        className={`grid size-11 place-items-center rounded-full transition lg:size-10 ${
          favorited
            ? "bg-amber-500/30 ring-1 ring-amber-400/50"
            : "bg-white/10 group-hover:bg-white/18"
        }`}
      >
        {favorited ? (
          <BookmarkCheck
            className={`size-5 text-amber-400 transition-all ${animating ? "scale-125" : "scale-100"}`}
          />
        ) : (
          <Bookmark className="size-5 text-white" />
        )}
      </span>
      <span
        className={`text-[10px] font-black lg:text-[10px] ${favorited ? "text-amber-400" : "text-white"}`}
      >
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
  game,
  gameId,
  disabled = false,
}: {
  count: number;
  open: boolean;
  onToggle: () => void;
  onShare: (platform?: SharePlatform) => Promise<void>;
  template: any;
  game?: any;
  gameId?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Link to THIS game (its real id), honoring the app's base path (/studio/).
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/?$/, "/");
  const path = `${base}play/${gameId ?? template?.id ?? ""}`;
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;

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
          : "Link copied! Ready to share on Instagram.",
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
        <svg
          className="size-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
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
        <svg
          className="size-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
      bgClass:
        "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-90 border-pink-400/20",
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
        <svg
          className="size-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      ),
      bgClass: "bg-zinc-800 hover:bg-zinc-700 border-zinc-700/50",
      action: () => handlePlatformClick("email"),
    },
  ];

  const shareDialog =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onToggle}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-lg border border-white/15 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={onToggle}
                title="Close"
                className="absolute right-4 top-4 grid size-9 place-items-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>

              <h3 className="mb-5 text-xl font-black text-white">Share this game</h3>

              <div className="mb-6 flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/10 text-3xl shadow-inner">
                  <img
                    src={game?.thumbnailUrl || getThumbnailUrl(gameId ?? template?.id)}
                    alt={game?.title ?? template?.name}
                    onError={(event) => {
                      // missing cover: show the emoji tile instead of a broken icon
                      event.currentTarget.style.display = "none";
                      const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = "block";
                    }}
                    className="size-full object-cover"
                  />
                  <span style={{ display: "none" }}>{templateEmoji[template?.id] || "🎮"}</span>
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-base font-black text-white">{game?.title ?? template?.name}</h4>
                  <p className="truncate text-xs font-bold uppercase text-white/40">
                    {game?.category ?? template?.category} - HTML5 Game
                  </p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-4 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.platform}
                    onClick={platform.action}
                    className="group flex min-w-0 flex-col items-center gap-2"
                  >
                    <span
                      className={`grid size-12 place-items-center rounded-md border transition group-hover:scale-105 ${platform.bgClass}`}
                    >
                      {platform.icon}
                    </span>
                    <span className="w-full truncate text-center text-[10px] font-bold text-white/60 group-hover:text-white">
                      {platform.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-white/10 pt-5">
                <label className="mb-2 block text-[10px] font-black uppercase text-white/40">
                  Direct Link
                </label>
                <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 p-1.5 pl-3">
                  <input
                    type="text"
                    readOnly
                    value={url}
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white/80 outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-md bg-white px-4 py-2.5 text-xs font-black text-black"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {toastMessage && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-md bg-white px-4 py-2 text-xs font-black text-black shadow-xl">
                  {toastMessage}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && onToggle()}
        disabled={disabled}
        title={disabled ? "Publish this game before sharing it" : "Share game"}
        data-testid="share-button"
        className="group flex min-w-12 flex-col items-center gap-1.5 text-white transition-transform active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 lg:min-w-12"
      >
        <span
          className={`grid size-11 place-items-center rounded-full transition lg:size-10 ${
            open ? "bg-white/25 ring-1 ring-white/30" : "bg-white/10 group-hover:bg-white/18"
          }`}
        >
          <Send className="size-5" />
        </span>
        <span className="text-[10px] font-black lg:text-[10px]">
          {count > 0 ? formatCount(count) : "Share"}
        </span>
      </button>

      {shareDialog}
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
        className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[70vh] flex-col rounded-t-3xl border-t border-white/15 bg-[oklch(0.12_0.02_280)] shadow-2xl animate-in slide-in-from-bottom lg:inset-x-auto lg:left-1/2 lg:w-full lg:max-w-[560px] lg:-translate-x-1/2">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">
            Comments
            {count > 0 && (
              <span className="ml-2 text-sm font-semibold text-white/50">
                ({formatCount(count)})
              </span>
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
        <div className="shrink-0 border-t border-white/10 px-4 pt-3 pb-6 sm:pb-3">
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
//  Details Modal
// ═══════════════════════════════════════════════════════════════════════════

function DetailsModal({
  open,
  onClose,
  template,
  profile,
  social,
  pkg,
  generatedPackageMatches,
  isFollowing,
  setIsFollowing,
}: any) {
  const navigate = useNavigate();
  if (!open) return null;

  const title = generatedPackageMatches ? pkg?.title : template?.name;
  const description = generatedPackageMatches ? pkg?.gameplay?.mechanic : template?.mechanic;
  // The game's own cover when it has one, else the template cover.
  const thumbnailSrc = (pkg as any)?.thumbnailUrl || (template?.id ? getThumbnailUrl(template.id) : undefined);
  const remix = () => {
    const seed = [
      `Remix ${title}`,
      description || `${template?.category ?? "Arcade"} game`,
      "Keep the core mechanics, physics, controls, and pacing.",
      "Change the theme, characters, visual style, and one gameplay twist.",
    ].join(". ");
    sessionStorage.setItem("kult-remix-prompt", seed);
    onClose();
    navigate({ to: "/create" });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[90vh] flex-col rounded-t-[2.5rem] bg-[#0a0a0f] shadow-2xl animate-in slide-in-from-bottom lg:inset-x-auto lg:left-1/2 lg:w-full lg:max-w-[560px] lg:-translate-x-1/2 p-6 pb-8">
        
        {/* Drag handle */}
        <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/20" />

        <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Thumbnail Image */}
          <div className="relative mb-6 w-full overflow-hidden rounded-2xl bg-white/5 aspect-[4/3] sm:aspect-video">
            <img
              src={thumbnailSrc}
              alt={title}
              onError={(event) => {
                event.currentTarget.style.display = "none";
                const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = "grid";
              }}
              className="size-full object-cover"
            />
            <div style={{ display: "none" }} className="size-full place-items-center text-6xl">
              {templateEmoji[template?.id] || "🎮"}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
              <Play size={12} className="fill-white" /> {formatCount(social.likeCount + 15200)}
            </div>

            <h2 className="absolute bottom-4 left-4 text-3xl font-black text-white drop-shadow-lg">
              {title}
            </h2>
          </div>

          {/* Profile Row */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="grid size-10 place-items-center rounded-full bg-white/10 font-display font-black">
                  {profile.avatar}
                </div>
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-white text-black"
                >
                  {isFollowing ? <Check size={10} /> : <Plus size={10} strokeWidth={3} />}
                </button>
              </div>
              <span className="font-bold text-white text-base">@{profile.name}</span>
            </div>
            <button
              type="button"
              onClick={remix}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <Shuffle size={16} /> Remix
            </button>
          </div>

          {/* Description */}
          <div className="mb-8 text-sm leading-relaxed text-white/80 font-medium">
            <p><strong className="text-white">**Description:**</strong> {description}</p>
            <p className="mt-2 text-white/50">---</p>
          </div>

          {/* Circular Action Buttons */}
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col items-center gap-2">
              <button onClick={social.handleLike} className="grid size-14 place-items-center rounded-full bg-white/5 transition hover:bg-white/10 active:scale-95 border border-white/5">
                <Heart size={24} className={social.liked ? "fill-rose-500 text-rose-500" : "text-white"} />
              </button>
              <span className="text-[11px] font-bold text-white">{formatCount(social.likeCount)}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <button onClick={() => { onClose(); social.setCommentsOpen(true); }} className="grid size-14 place-items-center rounded-full bg-white/5 transition hover:bg-white/10 active:scale-95 border border-white/5">
                <MessageCircle size={24} className="text-white" />
              </button>
              <span className="text-[11px] font-bold text-white">{formatCount(social.commentCount)}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button onClick={social.handleFavorite} className="grid size-14 place-items-center rounded-full bg-white/5 transition hover:bg-white/10 active:scale-95 border border-white/5">
                <Bookmark size={24} className={social.favorited ? "fill-yellow-400 text-yellow-400" : "text-white"} />
              </button>
              <span className="text-[11px] font-bold text-white">Favorite</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button onClick={() => { onClose(); social.setShareMenuOpen(true); }} className="grid size-14 place-items-center rounded-full bg-white/5 transition hover:bg-white/10 active:scale-95 border border-white/5">
                <Send size={24} className="text-white" />
              </button>
              <span className="text-[11px] font-bold text-white">Share</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button className="grid size-14 place-items-center rounded-full bg-white/5 transition hover:bg-white/10 active:scale-95 border border-white/5">
                <MessageSquareWarning size={24} className="text-white" />
              </button>
              <span className="text-[11px] font-bold text-white">Feedback</span>
            </div>
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
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: "/play/$gameId",
          params: { gameId: to },
          replace: true,
          resetScroll: false,
        })
      }
      aria-label={label}
      title={label}
      className="grid size-16 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/18"
    >
      {icon}
    </button>
  );
}
