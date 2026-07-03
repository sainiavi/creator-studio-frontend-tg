import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/studio/PageHeader";
import { Crown, Trophy, UserRound } from "lucide-react";
import rankOneAvatar from "@/assets/leaderboard-rank-1.png";
import rankTwoAvatar from "@/assets/leaderboard-rank-2.png";
import rankThreeAvatar from "@/assets/leaderboard-rank-3.png";
import { getCurrentUsername, getWalletAddress } from "@/lib/identity";

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
type CreatorRank = { rank: number; name: string; creatorScore: number };
type PlayerRank = { rank: number; name: string; kultPoints: number };
type RankRow = CreatorRank | PlayerRank;

const timeRanges: Array<{ id: TimeRange; label: string }> = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "allTime", label: "All Time" },
];

const creatorRanks: Record<TimeRange, CreatorRank[]> = {
  weekly: [
    { rank: 1, name: "@turbo", creatorScore: 52430 },
    { rank: 2, name: "@luma", creatorScore: 48720 },
    { rank: 3, name: "@circuit", creatorScore: 42110 },
    { rank: 4, name: "@neo", creatorScore: 38940 },
    { rank: 5, name: "@vex", creatorScore: 35180 },
    { rank: 6, name: "@bolt", creatorScore: 30640 },
    { rank: 7, name: "@pixl", creatorScore: 28490 },
    { rank: 8, name: "@gear", creatorScore: 25130 },
  ],
  monthly: [
    { rank: 1, name: "@luma", creatorScore: 188640 },
    { rank: 2, name: "@turbo", creatorScore: 176920 },
    { rank: 3, name: "@neo", creatorScore: 158300 },
    { rank: 4, name: "@circuit", creatorScore: 146880 },
    { rank: 5, name: "@bolt", creatorScore: 119240 },
    { rank: 6, name: "@pixl", creatorScore: 105790 },
    { rank: 7, name: "@vex", creatorScore: 98420 },
    { rank: 8, name: "@gear", creatorScore: 88110 },
  ],
  allTime: [
    { rank: 1, name: "@circuit", creatorScore: 824500 },
    { rank: 2, name: "@turbo", creatorScore: 792340 },
    { rank: 3, name: "@luma", creatorScore: 755120 },
    { rank: 4, name: "@neo", creatorScore: 690880 },
    { rank: 5, name: "@vex", creatorScore: 602430 },
    { rank: 6, name: "@gear", creatorScore: 544210 },
    { rank: 7, name: "@bolt", creatorScore: 489760 },
    { rank: 8, name: "@pixl", creatorScore: 430180 },
  ],
};

const playerRanks: Record<TimeRange, PlayerRank[]> = {
  weekly: [
    { rank: 1, name: "@ace", kultPoints: 14250 },
    { rank: 2, name: "@nova", kultPoints: 12880 },
    { rank: 3, name: "@rush", kultPoints: 11760 },
    { rank: 4, name: "@pixel", kultPoints: 10420 },
    { rank: 5, name: "@dash", kultPoints: 9630 },
    { rank: 6, name: "@orbit", kultPoints: 8520 },
    { rank: 7, name: "@spark", kultPoints: 7410 },
    { rank: 8, name: "@byte", kultPoints: 6880 },
  ],
  monthly: [
    { rank: 1, name: "@nova", kultPoints: 58420 },
    { rank: 2, name: "@ace", kultPoints: 53110 },
    { rank: 3, name: "@byte", kultPoints: 49760 },
    { rank: 4, name: "@dash", kultPoints: 45230 },
    { rank: 5, name: "@rush", kultPoints: 41880 },
    { rank: 6, name: "@orbit", kultPoints: 37420 },
    { rank: 7, name: "@pixel", kultPoints: 33190 },
    { rank: 8, name: "@spark", kultPoints: 29640 },
  ],
  allTime: [
    { rank: 1, name: "@ace", kultPoints: 244900 },
    { rank: 2, name: "@rush", kultPoints: 229540 },
    { rank: 3, name: "@nova", kultPoints: 216800 },
    { rank: 4, name: "@pixel", kultPoints: 198370 },
    { rank: 5, name: "@orbit", kultPoints: 176420 },
    { rank: 6, name: "@byte", kultPoints: 158910 },
    { rank: 7, name: "@dash", kultPoints: 149630 },
    { rank: 8, name: "@spark", kultPoints: 132080 },
  ],
};

const extraCreatorNames = [
  "@quartz",
  "@mira",
  "@zenith",
  "@nexus",
  "@riven",
  "@glitch",
  "@kairo",
  "@ember",
  "@vector",
  "@halo",
  "@sable",
  "@ion",
];

const extraPlayerNames = [
  "@flux",
  "@echo",
  "@rift",
  "@zen",
  "@juno",
  "@crush",
  "@flare",
  "@drift",
  "@cipher",
  "@tempo",
  "@blitz",
  "@ghost",
];

const scoreStepByRange: Record<TimeRange, number> = {
  weekly: 1180,
  monthly: 4650,
  allTime: 18400,
};

function fillCreatorRows(rows: CreatorRank[], timeRange: TimeRange) {
  const lastScore = rows.at(-1)?.creatorScore ?? 0;
  return [
    ...rows,
    ...extraCreatorNames.map((name, index) => ({
      rank: rows.length + index + 1,
      name,
      creatorScore: Math.max(1250, lastScore - scoreStepByRange[timeRange] * (index + 1)),
    })),
  ];
}

function fillPlayerRows(rows: PlayerRank[], timeRange: TimeRange) {
  const lastScore = rows.at(-1)?.kultPoints ?? 0;
  return [
    ...rows,
    ...extraPlayerNames.map((name, index) => ({
      rank: rows.length + index + 1,
      name,
      kultPoints: Math.max(500, lastScore - Math.round(scoreStepByRange[timeRange] * 0.42) * (index + 1)),
    })),
  ];
}

function formatStat(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

const wallets: Record<string, string> = {
  "@ace": "0xA7c314D9eB71f6A2cD445E9a1206FbAc98F4b210",
  "@bolt": "0xB01f70D3c6A9381d9f40875e23D4BeD1773A2061",
  "@byte": "0xB7E65f32D0Ac84a7C91d2f1100e9B4764E1c2345",
  "@circuit": "0xC18c871F90Aa62d0E44b6f28c8A82092cA9F3b71",
  "@dash": "0xD45a8F1E3c0b7a94e56c0d870f591a2B09eA1982",
  "@gear": "0x9Ea8573E55b023Fd67b1452C66eC6b726adCc844",
  "@luma": "0x1A0AE4d8bB920c17A5E6071f9DCE14E629B31040",
  "@neo": "0x4E050d9Aef6428C2f519E8b9E5d634F771D2c690",
  "@nova": "0x40Aa78F6a4E3b0D275C8Fe4b22a81c50A94E2030",
  "@orbit": "0x08b175C967D3d6639105596222dC75f34aFd0811",
  "@pixel": "0xF17e15B56D2810F75c2C9Ad90147d9dB0c0E7438",
  "@pixl": "0xF1A175E901dAeA332870fD21c926F0C8739bc528",
  "@rush": "0x805d946a88E92420a19F20B16611d0e245D72891",
  "@spark": "0x5Fa8A6345108d01237E1dce435105e197Af6066E",
  "@turbo": "0x708b0B6A90e6Bd4e7f6276b2527F642277932c4",
  "@vex": "0xAe09341e63097dC50c9B8ea398271621E32f14D9",
};

function compactWallet(name: string) {
  const wallet = walletFor(name);
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function walletFor(name: string) {
  if (wallets[name]) return wallets[name];
  const hex = Array.from(name)
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
    glow: "shadow-[0_0_42px_-8px_oklch(0.86_0.19_85_/_0.9)]",
    crown: "text-amber-300",
    halo: "bg-amber-300/20",
    rankBg: "bg-amber-300 text-background",
  },
  2: {
    order: "order-1",
    size: "size-20 sm:size-28",
    badge: "size-8 text-sm",
    lift: "translate-y-3",
    ring: "border-slate-200",
    glow: "shadow-[0_0_36px_-10px_oklch(0.86_0.02_270_/_0.75)]",
    crown: "text-slate-200",
    halo: "bg-slate-200/16",
    rankBg: "bg-slate-200 text-background",
  },
  3: {
    order: "order-3",
    size: "size-20 sm:size-28",
    badge: "size-8 text-sm",
    lift: "translate-y-4",
    ring: "border-orange-300",
    glow: "shadow-[0_0_36px_-10px_oklch(0.74_0.14_55_/_0.75)]",
    crown: "text-orange-300",
    halo: "bg-orange-300/16",
    rankBg: "bg-orange-300 text-background",
  },
} as const;

function isCurrentUserRow(row: RankRow, currentUsername: string, currentWallet: string | null) {
  return (
    row.name.toLowerCase() === currentUsername.toLowerCase() ||
    (!!currentWallet && walletFor(row.name).toLowerCase() === currentWallet.toLowerCase())
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
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/50 bg-[oklch(0.045_0.018_282)] px-3 py-8 shadow-card sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,oklch(0.72_0.2_315_/_0.2),transparent_34%),radial-gradient(circle_at_24%_38%,oklch(0.86_0.07_265_/_0.13),transparent_28%),radial-gradient(circle_at_76%_40%,oklch(0.74_0.14_55_/_0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-20 h-36 rounded-full bg-white/7 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-12 bottom-8 h-12 rounded-full bg-cyan-300/10 blur-2xl" />
      <div className="relative grid min-h-44 grid-cols-3 items-center gap-2 sm:min-h-56 sm:gap-6">
        {rows.slice(0, 3).map((row) => {
          const style = podiumStyle[row.rank as 1 | 2 | 3];
          const avatar = rankAvatars[row.rank as 1 | 2 | 3];
          const isYou = isCurrentUserRow(row, currentUsername, currentWallet);
          return (
            <div
              key={`podium-${row.rank}`}
              className={`animate-float-up flex min-w-0 flex-col items-center justify-self-center ${style.order} ${style.lift}`}
              style={{ animationDelay: `${row.rank * 70}ms`, opacity: 0 }}
            >
              <Crown className={`mb-1 size-6 drop-shadow ${style.crown} sm:size-8`} />
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-xl ${style.halo}`} />
                <div
                  className={`relative overflow-hidden rounded-full border-4 bg-background ${style.size} ${style.ring} ${style.glow}`}
                >
                  <img src={avatar} alt="" className="size-full object-cover" />
                </div>
                <div
                  className={`absolute -bottom-3 left-1/2 grid -translate-x-1/2 place-items-center rounded-full border-2 border-background font-display font-black ${style.badge} ${style.rankBg}`}
                >
                  {row.rank}
                </div>
              </div>
              <div className="mt-5 min-w-0 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <p className="truncate font-display text-xs font-black sm:text-sm">{row.name}</p>
                  {isYou && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-primary-foreground">
                      You
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate font-mono text-[10px] font-bold text-muted-foreground sm:text-xs">
                  {compactWallet(row.name)}
                </p>
                <p className={`mt-1 font-display text-sm font-black sm:text-base ${isCreator ? "text-amber-300" : "text-primary"}`}>
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
  const currentUsername = getCurrentUsername();
  const currentWallet = getWalletAddress();
  const isCreator = activeTab === "creator";
  const rows = isCreator
    ? fillCreatorRows(creatorRanks[timeRange], timeRange)
    : fillPlayerRows(playerRanks[timeRange], timeRange);
  const tableRows = rows.slice(3);

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle="Creator ranks by Creator Score · Player ranks by KULT Points"
      />

      <div className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:pb-6">
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
          rows={rows}
          isCreator={isCreator}
          currentUsername={currentUsername}
          currentWallet={currentWallet}
        />

        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/55 shadow-card">
          <div className="grid grid-cols-[64px_1fr_auto] gap-3 border-b border-border/50 px-4 py-3 text-left sm:grid-cols-[88px_1fr_180px] sm:px-5">
            <span className="label-mono text-[10px] text-muted-foreground">Rank</span>
            <span className="label-mono text-[10px] text-muted-foreground">Name</span>
            <span className="label-mono text-right text-[10px] text-muted-foreground">
              {isCreator ? "Creator Score" : "KULT Points (KP)"}
            </span>
          </div>

          <div className="max-h-[560px] divide-y divide-border/45 overflow-y-auto">
            {tableRows.map((row, index) => {
              const score = getScore(row);
              const isYou = isCurrentUserRow(row, currentUsername, currentWallet);
              return (
                <div
                  key={`${activeTab}-${row.rank}`}
                  className={`animate-float-up grid grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-3 transition sm:grid-cols-[88px_1fr_180px] sm:px-5 sm:py-4 ${
                    isYou
                      ? "bg-primary/10 shadow-[inset_3px_0_0_0_var(--color-primary)]"
                      : "hover:bg-background/30"
                  }`}
                  style={{ animationDelay: `${index * 35}ms`, opacity: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <RankBadge rank={row.rank} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-sm font-black sm:text-base">{row.name}</p>
                      {isYou && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-primary-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[10px] font-bold text-muted-foreground sm:text-xs">
                      {compactWallet(row.name)}
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
