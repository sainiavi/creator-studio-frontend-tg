import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Crown, Trophy, UserRound } from "lucide-react";
import rankOneAvatar from "@/assets/leaderboard-rank-1.webp";
import rankTwoAvatar from "@/assets/leaderboard-rank-2.webp";
import rankThreeAvatar from "@/assets/leaderboard-rank-3.webp";
import { LeaderboardSkeleton } from "@/components/studio/PageSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { LEADERBOARD_PAGE_SIZE } from "@/lib/pagination";
import { getCurrentUsername, getWalletAddress } from "@/lib/identity";
import {
  fetchCreatorScoreLeaderboard,
  fetchKultPointsLeaderboard,
  type CreatorScoreEntry,
  type KultPointsEntry,
} from "@/lib/api/leaderboards";

export const Route = createFileRoute("/_app/leaderboard")({
  pendingComponent: LeaderboardSkeleton,
  head: () => ({
    meta: [
      { title: "Leaderboard - Creator Studio" },
      { name: "description", content: "Creator and player rankings by Creator Score and KULT Points." },
    ],
  }),
  component: Leaderboard,
});

type LeaderboardTab = "creator" | "player";
type TimeRange = "weekly" | "monthly" | "allTime";
type CreatorRank = CreatorScoreEntry;
type PlayerRank = KultPointsEntry;
type RankRow = CreatorRank | PlayerRank;

const timeRanges: Array<{ id: TimeRange; label: string }> = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "allTime", label: "All Time" },
];

function formatStat(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function compactWallet(row: RankRow) {
  const wallet = walletFor(row);
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function walletFor(row: RankRow) {
  const id = "walletAddress" in row ? row.walletAddress : row.creatorId;
  if (/^0x[a-f0-9]{40}$/i.test(id)) return id;
  const hex = Array.from(id || row.name)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .padEnd(40, "0")
    .slice(0, 40);
  return `0x${hex}`;
}

function getScore(row: RankRow) {
  return "creatorScore" in row ? row.creatorScore : row.kultPoints;
}

const rankAvatars: Record<1 | 2 | 3, string> = {
  1: rankOneAvatar,
  2: rankTwoAvatar,
  3: rankThreeAvatar,
};

const podiumStyle = {
  1: {
    order: "order-2",
    size: "size-20 sm:size-28",
    badge: "size-8 text-sm sm:size-9 sm:text-base",
    ring: "border-amber-300",
    glow: "shadow-[0_0_42px_-8px_oklch(0.86_0.19_85_/_0.9),0_18px_60px_-26px_rgba(250,204,21,0.95)]",
    crown: "text-amber-600",
    halo: "bg-amber-300/20",
    rankBg: "bg-gradient-to-br from-amber-100 via-amber-300 to-yellow-500 text-background shadow-[0_0_22px_-6px_rgba(251,191,36,0.9)]",
  },
  2: {
    order: "order-1",
    size: "size-16 sm:size-24",
    badge: "size-7 text-xs sm:size-8 sm:text-sm",
    ring: "border-slate-200",
    glow: "shadow-[0_0_36px_-10px_oklch(0.86_0.02_270_/_0.75),0_18px_54px_-30px_rgba(226,232,240,0.9)]",
    crown: "text-slate-500",
    halo: "bg-slate-200/16",
    rankBg: "bg-gradient-to-br from-white via-slate-200 to-slate-400 text-background shadow-[0_0_18px_-7px_rgba(226,232,240,0.9)]",
  },
  3: {
    order: "order-3",
    size: "size-16 sm:size-24",
    badge: "size-7 text-xs sm:size-8 sm:text-sm",
    ring: "border-orange-300",
    glow: "shadow-[0_0_36px_-10px_oklch(0.74_0.14_55_/_0.75),0_18px_54px_-30px_rgba(251,146,60,0.9)]",
    crown: "text-orange-600",
    halo: "bg-orange-300/16",
    rankBg: "bg-gradient-to-br from-orange-100 via-orange-300 to-orange-500 text-background shadow-[0_0_18px_-7px_rgba(251,146,60,0.9)]",
  },
} as const;

function isCurrentUserRow(row: RankRow, currentUsername: string, currentWallet: string | null) {
  const rowWallet = walletFor(row);
  return (
    row.name.toLowerCase() === currentUsername.toLowerCase() ||
    (!!currentWallet && rowWallet.toLowerCase() === currentWallet.toLowerCase())
  );
}

function shortName(name: string, max = 14) {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function Podium({
  rows,
  isCreator,
  currentUsername,
  currentWallet,
}: {
  rows: RankRow[];
  isCreator: boolean;
  currentUsername: string;
  currentWallet: string | null;
}) {
  const podiumRows = rows.slice(0, 3);
  const layoutClass =
    podiumRows.length === 1
      ? "flex min-h-40 items-center justify-center sm:min-h-52"
      : podiumRows.length === 2
        ? "grid min-h-40 grid-cols-2 items-start justify-center gap-3 sm:min-h-52 sm:gap-8"
        : "grid min-h-40 grid-cols-3 items-start gap-1.5 sm:min-h-52 sm:gap-4";

  return (
    <div className="relative mb-6 overflow-hidden rounded-[1.75rem] border-2 border-fuchsia-200/80 bg-white/90 px-2.5 py-7 text-violet-950 shadow-[0_12px_30px_rgba(124,58,237,0.2),0_0_26px_rgba(217,70,239,0.22),inset_0_1px_12px_rgba(255,255,255,0.92)] backdrop-blur sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(250,204,21,0.22),transparent_31%),radial-gradient(circle_at_24%_38%,rgba(168,85,247,0.14),transparent_30%),radial-gradient(circle_at_76%_40%,rgba(251,146,60,0.14),transparent_31%)]" />
      <div className={`relative ${layoutClass}`}>
        {podiumRows.map((row, index) => {
          const style = podiumStyle[row.rank as 1 | 2 | 3];
          const avatar = rankAvatars[row.rank as 1 | 2 | 3];
          const isYou = isCurrentUserRow(row, currentUsername, currentWallet);
          const placementClass =
            podiumRows.length < 3 ? "" : `${style.order} ${row.rank === 1 ? "pt-0" : "pt-6 sm:pt-8"}`;
          return (
            <div
              key={`podium-${row.rank}`}
              className={`animate-float-up flex w-full min-w-0 max-w-full flex-col items-center justify-self-center overflow-hidden px-0.5 ${placementClass}`}
              style={{ animationDelay: `${(index + 1) * 70}ms`, opacity: 0 }}
            >
              <Crown className={`mb-1 size-5 drop-shadow-[0_0_10px_currentColor] ${style.crown} sm:size-7`} />
              <div className="relative shrink-0">
                <div className={`absolute inset-0 rounded-full blur-xl ${style.halo}`} />
                <div
                  className={`relative overflow-hidden rounded-full border-4 bg-background ring-1 ring-white/20 ${style.size} ${style.ring} ${style.glow}`}
                >
                  <img src={avatar} alt="" className="size-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/18 via-transparent to-black/18" />
                </div>
                <div
                  className={`absolute -bottom-2.5 left-1/2 grid -translate-x-1/2 place-items-center rounded-full border-2 border-background font-display font-black ring-1 ring-white/25 ${style.badge} ${style.rankBg}`}
                >
                  {row.rank}
                </div>
              </div>
              <div className="mt-5 w-full min-w-0 max-w-full space-y-0.5 text-center">
                <div className="flex min-w-0 items-center justify-center gap-1">
                  <p
                    className="min-w-0 truncate font-display text-[11px] font-black leading-tight sm:text-sm"
                    title={row.name}
                  >
                    {shortName(row.name, row.rank === 1 ? 16 : 12)}
                  </p>
                  {isYou && (
                    <span className="shrink-0 rounded-full bg-gradient-to-r from-primary to-[oklch(0.65_0.25_295)] px-1.5 py-0.5 text-[8px] font-black text-primary-foreground">
                      You
                    </span>
                  )}
                </div>
                <p className="truncate font-mono text-[9px] font-bold text-violet-500 sm:text-[11px]">
                  {compactWallet(row)}
                </p>
                <p
                  className={`font-display text-base font-black tabular-nums sm:text-lg ${
                    isCreator ? "text-violet-900" : "text-fuchsia-800"
                  }`}
                >
                  {formatStat(getScore(row))}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const isTopThree = rank <= 3;
  return (
    <div
      className={`grid size-9 shrink-0 place-items-center rounded-lg border font-display text-sm font-black ${
        isTopThree
          ? "border-amber-300/60 bg-amber-100 text-amber-600"
          : "border-violet-200 bg-white/70 text-violet-600"
      }`}
    >
      {rank}
    </div>
  );
}

function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("creator");
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
  const [creatorRows, setCreatorRows] = useState<CreatorRank[]>([]);
  const [playerRows, setPlayerRows] = useState<PlayerRank[]>([]);
  const [rowLimit, setRowLimit] = useState(LEADERBOARD_PAGE_SIZE);
  const [hasMoreRows, setHasMoreRows] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUsername = getCurrentUsername();
  const currentWallet = getWalletAddress();
  const isCreator = activeTab === "creator";
  const rows = isCreator ? creatorRows : playerRows;
  const podiumRows = rows;
  const tableRows = rows.slice(3);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRowLimit(LEADERBOARD_PAGE_SIZE);
    void (async () => {
      try {
        const [creatorTop, playerTop] = await Promise.all([
          fetchCreatorScoreLeaderboard(LEADERBOARD_PAGE_SIZE, timeRange),
          fetchKultPointsLeaderboard(LEADERBOARD_PAGE_SIZE, timeRange),
        ]);
        if (cancelled) return;
        setCreatorRows(creatorTop.entries);
        setPlayerRows(playerTop.entries);
        setHasMoreRows(
          creatorTop.entries.length >= LEADERBOARD_PAGE_SIZE ||
            playerTop.entries.length >= LEADERBOARD_PAGE_SIZE,
        );
      } catch (requestError) {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : "Unable to load leaderboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  const loadMoreRows = useCallback(() => {
    if (loadingMore || !hasMoreRows) return;
    const nextLimit = rowLimit + LEADERBOARD_PAGE_SIZE;
    setLoadingMore(true);
    void (async () => {
      try {
        const board = isCreator
          ? await fetchCreatorScoreLeaderboard(nextLimit, timeRange)
          : await fetchKultPointsLeaderboard(nextLimit, timeRange);
        if (isCreator) setCreatorRows(board.entries);
        else setPlayerRows(board.entries);
        setRowLimit(nextLimit);
        setHasMoreRows(board.entries.length >= nextLimit);
      } catch {
        setHasMoreRows(false);
      } finally {
        setLoadingMore(false);
      }
    })();
  }, [hasMoreRows, isCreator, loadingMore, rowLimit, timeRange]);

  const loadMoreRef = useInfiniteScroll(loadMoreRows, hasMoreRows && !loading && tableRows.length > 0);

  return (
    <div className="relative min-h-screen text-violet-950">
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-0 sm:px-6 sm:py-6 lg:px-10">
        <section className="sticky top-0 z-30 relative -mx-4 mb-5 overflow-hidden border-b border-violet-400/25 bg-[#160b2e] px-4 py-3.5 text-white shadow-[0_8px_28px_rgba(88,28,135,0.35)] sm:mx-0 md:relative md:top-auto md:z-20 md:rounded-[1.65rem] md:border-2 md:border-fuchsia-200 md:border-b-2 md:bg-[#100528] md:px-6 md:py-4 md:shadow-[0_6px_0_rgba(65,24,138,0.75),0_0_34px_rgba(217,70,239,0.9),inset_0_1px_18px_rgba(255,255,255,0.16)] md:backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(217,70,239,0.18),transparent_50%),radial-gradient(circle_at_10%_50%,rgba(139,92,246,0.15),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="grid size-10 place-items-center rounded-xl border border-amber-400/40 bg-amber-400/10 shadow-[0_0_16px_-4px_rgba(251,191,36,0.5)] sm:size-12 sm:rounded-2xl">
                <Trophy className="size-5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)] sm:size-6" strokeWidth={2.4} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-black leading-none text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] sm:text-3xl">Leaderboard</h1>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.22em] text-violet-200/80 sm:mt-1 sm:text-xs">Creator Score & KULT Points</p>
              </div>
            </div>
          </div>
        </section>
        <div className="mb-5 flex flex-col items-center justify-center gap-3">
          <div className="inline-flex w-fit rounded-2xl border-2 border-violet-300/70 bg-white/70 p-1 shadow-[0_0_18px_rgba(168,85,247,0.24),inset_0_1px_8px_rgba(255,255,255,0.9)] backdrop-blur">
            <button
              type="button"
              onClick={() => setActiveTab("creator")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition ${
                isCreator
                  ? "bg-[linear-gradient(135deg,#a855f7,#ec4899)] text-white shadow-[0_4px_14px_rgba(168,85,247,0.45)]"
                  : "text-violet-700 hover:text-violet-950"
              }`}
            >
              <Trophy className="size-4" />
              Creator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("player")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition ${
                !isCreator
                  ? "bg-[linear-gradient(135deg,#a855f7,#ec4899)] text-white shadow-[0_4px_14px_rgba(168,85,247,0.45)]"
                  : "text-violet-700 hover:text-violet-950"
              }`}
            >
              <UserRound className="size-4" />
              Player
            </button>
          </div>

          <div className="inline-flex w-fit rounded-2xl border-2 border-violet-300/70 bg-white/70 p-1 shadow-[0_0_18px_rgba(168,85,247,0.2),inset_0_1px_8px_rgba(255,255,255,0.9)] backdrop-blur">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setTimeRange(range.id)}
                className={`rounded-lg px-3 py-2 text-xs font-black transition sm:px-4 ${
                  timeRange === range.id
                    ? "bg-violet-100 text-violet-950"
                    : "text-violet-600 hover:text-violet-950"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <Podium
          rows={podiumRows}
          isCreator={isCreator}
          currentUsername={currentUsername}
          currentWallet={currentWallet}
        />

        <div className="overflow-hidden rounded-[1.5rem] border-2 border-fuchsia-200/80 bg-white/82 text-violet-950 shadow-[0_10px_24px_rgba(124,58,237,0.18),0_0_20px_rgba(217,70,239,0.18),inset_0_1px_10px_rgba(255,255,255,0.92)] backdrop-blur">
          <div className="grid grid-cols-[64px_1fr_auto] gap-3 border-b border-violet-200/70 px-4 py-3 text-left sm:grid-cols-3 sm:px-5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-500">Rank</span>
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-500 sm:text-center">Name</span>
            <span className="text-right text-[10px] font-black uppercase tracking-[0.14em] text-violet-500">
              {isCreator ? "Creator Score" : "KULT Points (KP)"}
            </span>
          </div>

          <div className="max-h-[560px] divide-y divide-violet-200/70 overflow-y-auto">
            {loading &&
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[64px_1fr_auto] gap-3 px-4 py-4 sm:grid-cols-3 sm:px-5"
                >
                  <Skeleton className="h-5 w-8" />
                  <Skeleton className="h-5 w-40 sm:mx-auto" />
                  <Skeleton className="h-5 w-16 justify-self-end" />
                </div>
              ))}
            {!loading && error && (
              <div className="px-5 py-10 text-center text-sm font-bold text-destructive">
                {error}
              </div>
            )}
            {!loading && !error && rows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm font-bold text-violet-600">
                No ranked users yet.
              </div>
            )}
            {!loading && !error && rows.length > 0 && tableRows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm font-bold text-violet-600">
                All ranked users are on the podium.
              </div>
            )}
            {tableRows.map((row, index) => {
              const score = getScore(row);
              const isYou = isCurrentUserRow(row, currentUsername, currentWallet);
              return (
                <div
                  key={`${activeTab}-${row.rank}`}
                  className={`animate-float-up grid grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-3 transition sm:grid-cols-3 sm:px-5 sm:py-4 ${
                    isYou
                      ? "bg-fuchsia-100/80 shadow-[inset_3px_0_0_0_rgb(217,70,239)]"
                      : "hover:bg-violet-50/70"
                  }`}
                  style={{ animationDelay: `${Math.min(index, 20) * 35}ms`, opacity: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <RankBadge rank={row.rank} />
                  </div>
                  <div className="min-w-0 sm:text-center">
                    <div className="flex items-center gap-2 sm:justify-center">
                      <p className="truncate font-display text-sm font-black sm:text-base">{row.name}</p>
                      {isYou && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-primary-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[10px] font-bold text-violet-500 sm:text-xs">
                      {compactWallet(row)}
                    </p>
                  </div>
                  <p
                    className={`text-right text-sm font-black sm:text-lg ${
                      isCreator ? "text-violet-900 [text-shadow:0_0_6px_rgba(139,92,246,0.25)]" : "text-fuchsia-800 [text-shadow:0_0_6px_rgba(217,70,239,0.2)]"
                    }`}
                    style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", letterSpacing: "0.02em" }}
                  >
                    {formatStat(score)}
                  </p>
                </div>
              );
            })}
            {(hasMoreRows || loadingMore) && (
              <div
                ref={loadMoreRef}
                className="px-5 py-4 text-center text-xs font-semibold text-violet-600"
              >
                {loadingMore ? "Loading more ranks…" : ""}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
