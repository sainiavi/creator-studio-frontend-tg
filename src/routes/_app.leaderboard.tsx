import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/studio/PageHeader";
import { Crown, Trophy, UserRound } from "lucide-react";
import rankOneAvatar from "@/assets/leaderboard-rank-1.png";
import rankTwoAvatar from "@/assets/leaderboard-rank-2.png";
import rankThreeAvatar from "@/assets/leaderboard-rank-3.png";
import { getCurrentUsername, getWalletAddress } from "@/lib/identity";
import {
  fetchCreatorScoreLeaderboard,
  fetchKultPointsLeaderboard,
  type CreatorScoreEntry,
  type KultPointsEntry,
} from "@/lib/api/leaderboards";

export const Route = createFileRoute("/_app/leaderboard")({
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
    size: "size-24 sm:size-32",
    badge: "size-9 text-base",
    lift: "-translate-y-5",
    ring: "border-amber-300",
    glow: "shadow-[0_0_42px_-8px_oklch(0.86_0.19_85_/_0.9),0_18px_60px_-26px_rgba(250,204,21,0.95)]",
    crown: "text-amber-300",
    halo: "bg-amber-300/20",
    rankBg: "bg-gradient-to-br from-amber-100 via-amber-300 to-yellow-500 text-background shadow-[0_0_22px_-6px_rgba(251,191,36,0.9)]",
  },
  2: {
    order: "order-1",
    size: "size-20 sm:size-28",
    badge: "size-8 text-sm",
    lift: "translate-y-3",
    ring: "border-slate-200",
    glow: "shadow-[0_0_36px_-10px_oklch(0.86_0.02_270_/_0.75),0_18px_54px_-30px_rgba(226,232,240,0.9)]",
    crown: "text-slate-200",
    halo: "bg-slate-200/16",
    rankBg: "bg-gradient-to-br from-white via-slate-200 to-slate-400 text-background shadow-[0_0_18px_-7px_rgba(226,232,240,0.9)]",
  },
  3: {
    order: "order-3",
    size: "size-20 sm:size-28",
    badge: "size-8 text-sm",
    lift: "translate-y-4",
    ring: "border-orange-300",
    glow: "shadow-[0_0_36px_-10px_oklch(0.74_0.14_55_/_0.75),0_18px_54px_-30px_rgba(251,146,60,0.9)]",
    crown: "text-orange-300",
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
  const layoutClass = podiumRows.length === 1
    ? "flex min-h-44 items-center justify-center sm:min-h-56"
    : podiumRows.length === 2
      ? "grid min-h-44 grid-cols-2 items-center justify-center gap-4 sm:min-h-56 sm:gap-8"
      : "grid min-h-44 grid-cols-3 items-center gap-2 sm:min-h-56 sm:gap-6";

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.045_0.018_282)] px-3 py-8 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.95)] sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,oklch(0.86_0.18_85_/_0.2),transparent_31%),radial-gradient(circle_at_24%_38%,oklch(0.64_0.22_282_/_0.16),transparent_30%),radial-gradient(circle_at_76%_40%,oklch(0.74_0.14_55_/_0.16),transparent_31%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-5 top-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-6 top-20 h-36 rounded-full bg-white/8 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-12 bottom-8 h-12 rounded-full bg-cyan-300/12 blur-2xl" />
      <div className={`relative ${layoutClass}`}>
        {podiumRows.map((row, index) => {
          const style = podiumStyle[row.rank as 1 | 2 | 3];
          const avatar = rankAvatars[row.rank as 1 | 2 | 3];
          const isYou = isCurrentUserRow(row, currentUsername, currentWallet);
          const placementClass = podiumRows.length < 3 ? "" : `${style.order} ${style.lift}`;
          return (
            <div
              key={`podium-${row.rank}`}
              className={`animate-float-up flex min-w-0 flex-col items-center justify-self-center ${placementClass}`}
              style={{ animationDelay: `${(index + 1) * 70}ms`, opacity: 0 }}
            >
              <Crown className={`mb-1 size-6 drop-shadow-[0_0_10px_currentColor] ${style.crown} sm:size-8`} />
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-xl ${style.halo}`} />
                <div className="absolute -inset-2 rounded-full border border-white/10 bg-white/5 blur-[1px]" />
                <div
                  className={`relative overflow-hidden rounded-full border-4 bg-background ring-1 ring-white/20 ${style.size} ${style.ring} ${style.glow}`}
                >
                  <img src={avatar} alt="" className="size-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/18 via-transparent to-black/18" />
                </div>
                <div
                  className={`absolute -bottom-3 left-1/2 grid -translate-x-1/2 place-items-center rounded-full border-2 border-background font-display font-black ring-1 ring-white/25 ${style.badge} ${style.rankBg}`}
                >
                  {row.rank}
                </div>
              </div>
              <div className="mt-5 min-w-0 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="truncate font-display text-xs font-black sm:text-sm">{row.name}</p>
                  {isYou && (
                    <span className="rounded-full bg-gradient-to-r from-primary to-[oklch(0.65_0.25_295)] px-2 py-0.5 text-[9px] font-black text-primary-foreground shadow-[0_0_14px_-6px_oklch(0.72_0.27_340)]">
                      You
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate font-mono text-[10px] font-bold text-muted-foreground sm:text-xs">
                  {compactWallet(row)}
                </p>
                <p className={`mt-1 font-display text-sm font-black drop-shadow sm:text-base ${isCreator ? "text-amber-300" : "text-primary"}`}>
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
          ? "border-amber-300/35 bg-amber-300/12 text-amber-300"
          : "border-border/55 bg-background/35 text-muted-foreground"
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUsername = getCurrentUsername();
  const currentWallet = getWalletAddress();
  const isCreator = activeTab === "creator";
  const rows = isCreator ? creatorRows : playerRows;
  // The podium is always the selected range's real top 3 — no all-time fallback.
  const podiumRows = rows;
  const tableRows = rows.slice(3);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Two-phase load: top 15 paints the podium and first rows immediately,
    // then the full top 1000 swaps in behind it.
    void (async () => {
      let firstPhaseDone = false;
      try {
        const [creatorTop, playerTop] = await Promise.all([
          fetchCreatorScoreLeaderboard(15, timeRange),
          fetchKultPointsLeaderboard(15, timeRange),
        ]);
        if (cancelled) return;
        setCreatorRows(creatorTop.entries);
        setPlayerRows(playerTop.entries);
        setLoading(false);
        firstPhaseDone = true;

        const [creatorFull, playerFull] = await Promise.all([
          fetchCreatorScoreLeaderboard(1000, timeRange),
          fetchKultPointsLeaderboard(1000, timeRange),
        ]);
        if (cancelled) return;
        setCreatorRows(creatorFull.entries);
        setPlayerRows(playerFull.entries);
      } catch (requestError) {
        if (cancelled) return;
        // Only surface an error when even the first phase failed — if the top
        // 15 already rendered, keep them instead of blanking the page.
        if (!firstPhaseDone) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load leaderboard.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle="Creator ranks by Creator Score · Player ranks by KULT Points"
      />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="mb-5 flex flex-col items-center justify-center gap-3">
          <div className="inline-flex w-fit rounded-xl border border-border/60 bg-card/60 p-1 shadow-card">
            <button
              type="button"
              onClick={() => setActiveTab("creator")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black transition ${
                isCreator
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserRound className="size-4" />
              Player
            </button>
          </div>

          <div className="inline-flex w-fit rounded-xl border border-border/60 bg-background/35 p-1">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setTimeRange(range.id)}
                className={`rounded-lg px-3 py-2 text-xs font-black transition sm:px-4 ${
                  timeRange === range.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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

        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/55 shadow-card">
          <div className="grid grid-cols-[64px_1fr_auto] gap-3 border-b border-border/50 px-4 py-3 text-left sm:grid-cols-3 sm:px-5">
            <span className="label-mono text-[10px] text-muted-foreground">Rank</span>
            <span className="label-mono text-[10px] text-muted-foreground sm:text-center">Name</span>
            <span className="label-mono text-right text-[10px] text-muted-foreground">
              {isCreator ? "Creator Score" : "KULT Points (KP)"}
            </span>
          </div>

          <div className="max-h-[560px] divide-y divide-border/45 overflow-y-auto">
            {loading && (
              <div className="px-5 py-10 text-center text-sm font-bold text-muted-foreground">
                Loading real leaderboard data...
              </div>
            )}
            {!loading && error && (
              <div className="px-5 py-10 text-center text-sm font-bold text-destructive">
                {error}
              </div>
            )}
            {!loading && !error && rows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm font-bold text-muted-foreground">
                No ranked users yet.
              </div>
            )}
            {!loading && !error && rows.length > 0 && tableRows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm font-bold text-muted-foreground">
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
                      ? "bg-primary/10 shadow-[inset_3px_0_0_0_var(--color-primary)]"
                      : "hover:bg-background/30"
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
                    <p className="mt-0.5 truncate font-mono text-[10px] font-bold text-muted-foreground sm:text-xs">
                      {compactWallet(row)}
                    </p>
                  </div>
                  <p
                    className={`font-display text-right text-sm font-black sm:text-lg ${
                      isCreator ? "text-amber-300" : "text-primary"
                    }`}
                  >
                    {formatStat(score)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
