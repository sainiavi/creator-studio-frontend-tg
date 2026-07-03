import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown, Medal, Trophy, Zap } from "lucide-react";
import { PageHeader } from "@/components/studio/PageHeader";
import { fetchEconomyLeaderboard, type EconomyLeaderboardEntry } from "@/lib/api/social";

export const Route = createFileRoute("/_app/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard - Creator Studio" },
      { name: "description", content: "Creator and player rankings by Creator Score and KULT Points." },
    ],
  }),
  component: Leaderboard,
});

function formatStat(value: number | undefined) {
  const n = value ?? 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function shortWallet(value: string | undefined) {
  if (!value) return "Unknown";
  return value.length > 14 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="size-5 text-[oklch(0.86_0.16_85)]" />;
  if (rank <= 3) return <Medal className="size-5 text-primary" />;
  return <Trophy className="size-4 text-muted-foreground/60" />;
}

function LeaderboardRow({ entry, mode }: { entry: EconomyLeaderboardEntry; mode: "cs" | "kp" }) {
  const identity = mode === "cs" ? entry.creatorId : entry.walletAddress ?? entry.userId;
  const value = mode === "cs" ? entry.creatorScore ?? entry.lifetimeScore : entry.kultPoints;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/65 px-4 py-3">
      <div className="flex w-10 items-center gap-2">
        {rankIcon(entry.rank)}
        <span className="font-display text-sm font-black text-muted-foreground">{entry.rank}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold">{shortWallet(identity)}</p>
        <p className="label-mono text-[9px] text-muted-foreground">
          {mode === "kp" ? `Level ${entry.level?.level ?? 1}` : "Creator"}
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-base font-black">{formatStat(value)}</p>
        <p className="label-mono text-[9px] text-muted-foreground">{mode === "kp" ? "KP" : "CS"}</p>
      </div>
    </div>
  );
}

function Leaderboard() {
  const [mode, setMode] = useState<"cs" | "kp">("cs");
  const [period, setPeriod] = useState<"weekly" | "all-time">("weekly");
  const [entries, setEntries] = useState<EconomyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchEconomyLeaderboard(mode, period, 100)
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [mode, period]);

  const title = mode === "cs" ? "Creator Score" : "KULT Points";
  const top = useMemo(() => entries.slice(0, 3), [entries]);

  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Separate boards for Creator Score and KULT Points" />

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("cs")}
            className={`rounded-md border px-3 py-2 text-xs font-bold ${mode === "cs" ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card/60 text-muted-foreground"}`}
          >
            Creator Score
          </button>
          <button
            type="button"
            onClick={() => setMode("kp")}
            className={`rounded-md border px-3 py-2 text-xs font-bold ${mode === "kp" ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card/60 text-muted-foreground"}`}
          >
            KULT Points
          </button>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setPeriod("weekly")}
              className={`rounded-md border px-3 py-2 text-xs font-bold ${period === "weekly" ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card/60 text-muted-foreground"}`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setPeriod("all-time")}
              className={`rounded-md border px-3 py-2 text-xs font-bold ${period === "all-time" ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card/60 text-muted-foreground"}`}
            >
              All-Time
            </button>
          </div>
        </div>

        <section className="rounded-lg border border-border/60 bg-card/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-black">{title}</h2>
              <p className="label-mono text-[10px] text-muted-foreground">{period === "weekly" ? "Weekly" : "All-Time"}</p>
            </div>
            <Zap className="size-5 text-primary" />
          </div>

          {top.length > 0 && (
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              {top.map((entry) => (
                <div key={`${mode}-${period}-${entry.rank}`} className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    {rankIcon(entry.rank)}
                    <span className="font-display text-2xl font-black">#{entry.rank}</span>
                  </div>
                  <p className="truncate font-display text-sm font-bold">
                    {shortWallet(mode === "cs" ? entry.creatorId : entry.walletAddress ?? entry.userId)}
                  </p>
                  <p className="mt-2 font-display text-xl font-black">
                    {formatStat(mode === "cs" ? entry.creatorScore ?? entry.lifetimeScore : entry.kultPoints)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">Loading leaderboard...</p>}
            {!loading && entries.length === 0 && <p className="text-sm text-muted-foreground">No ranked entries yet.</p>}
            {!loading && entries.map((entry) => (
              <LeaderboardRow
                key={`${mode}-${period}-${entry.rank}-${entry.creatorId ?? entry.walletAddress ?? entry.userId}`}
                entry={entry}
                mode={mode}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
