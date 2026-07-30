import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Activity,
  BarChart3,
  ChevronDown,
  Coins,
  Heart,
  Loader2,
  MessageCircle,
  Play,
  Repeat2,
  Share2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/studio/PageHeader";
import { getThumbnailCandidates } from "@/lib/studio-meta";
import { onImageErrorUnlessUnmounting } from "@/lib/safeImageError";
import { getCurrentUserId } from "@/lib/identity";
import {
  fetchCreatorDashboard,
  type CreatorDashboard,
  type DashboardGame,
  type DashboardRange,
  type DashboardSeries,
  type DashboardSeriesPoint,
} from "@/lib/api/dashboard";
import { fetchComments, fetchPointSummary, type Comment } from "@/lib/api/social";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Creator Studio" },
      { name: "description", content: "Your games' analytics, comments, and earnings." },
    ],
  }),
  component: Dashboard,
});

type TabKey = "analytics" | "activity" | "earn";

const TABS: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "earn", label: "Earn", icon: Coins },
];

// Per-game / earnings lists collapse to this many rows behind a "View all".
const COLLAPSED_GAME_COUNT = 5;

const RANGE_OPTIONS: { value: DashboardRange; label: string; caption: string }[] = [
  { value: "day", label: "Last day", caption: "last 24 hours" },
  { value: "week", label: "Last week", caption: "last 7 days" },
  { value: "month", label: "Last month", caption: "last 30 days" },
  { value: "year", label: "Last year", caption: "last 12 months" },
];

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

// Seconds → "1h 20m" / "45m" / "30s", for the Time metric.
function formatDuration(seconds: number) {
  const total = Math.round(seconds);
  if (total <= 0) return "0m";
  const hours = Math.floor(total / 3600);
  const minutes = Math.round((total % 3600) / 60);
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${total}s`;
}

// The chart can plot any of these metrics; the dropdown switches between them.
type MetricKey = "plays" | "games" | "time";

const METRICS: Record<
  MetricKey,
  {
    label: string;
    value: (point: DashboardSeriesPoint) => number;
    format: (value: number) => string;
    noun: string;
    axis: string;
  }
> = {
  plays: { label: "Plays", value: (p) => p.plays, format: formatNumber, noun: "plays", axis: "plays" },
  games: { label: "Games", value: (p) => p.games, format: formatNumber, noun: "games", axis: "no. of games" },
  time: { label: "Time", value: (p) => p.timeSeconds, format: formatDuration, noun: "", axis: "play time" },
};

const METRIC_OPTIONS: { value: MetricKey; label: string }[] = [
  { value: "plays", label: "Plays" },
  { value: "games", label: "Games" },
  { value: "time", label: "Time" },
];

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function GameThumb({ id, title, thumbnailUrl }: { id: string; title: string; thumbnailUrl: string | null }) {
  const candidates = useMemo(
    () => getThumbnailCandidates({ id, thumbnailUrl }),
    [id, thumbnailUrl],
  );
  const [index, setIndex] = useState(0);
  const src = candidates[index];
  return (
    <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-fuchsia-400/20 bg-[#160b2e]">
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="size-full object-cover"
          onError={(event) =>
            onImageErrorUnlessUnmounting(event.currentTarget, () =>
              setIndex((current) => Math.min(current + 1, candidates.length)),
            )
          }
        />
      ) : (
        <div className="grid size-full place-items-center text-sm font-black text-violet-200/60">
          {title.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// Catmull-Rom → cubic-bezier: turns the raw points into a smooth flowing curve
// instead of sharp zig-zags. Coordinates are in the 0–100 viewBox space.
// Control-point y is clamped to [yMin, yMax] so a flat-then-spike series can't
// make the spline overshoot below the baseline (or above the top) and clip.
function smoothPath(pts: { x: number; y: number }[], yMin: number, yMax: number) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  const clampY = (y: number) => Math.min(yMax, Math.max(yMin, y));
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6);
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

// Stylish inline SVG area chart: smooth gradient stroke with a neon glow, a
// soft area fill, gridlines, a highlighted/pulsing peak, and a hover tooltip.
// Pure SVG + HTML overlay — no chart library, crisp at any width.
function PlaysChart({ series, metric }: { series: DashboardSeries; metric: MetricKey }) {
  const data = series.points;
  const cfg = METRICS[metric];
  // Coerce to a finite number so a missing field (e.g. an un-restarted backend
  // that doesn't send `games`/`timeSeconds`) can't turn the whole path into NaN
  // and blank the line — it just reads as 0.
  const valueOf = (point: DashboardSeriesPoint) => {
    const value = Number(cfg.value(point));
    return Number.isFinite(value) ? value : 0;
  };
  const [hover, setHover] = useState<number | null>(null);
  const padX = 3;
  const padY = 12;
  const innerW = 100 - padX * 2;
  const innerH = 100 - padY * 2;
  const max = Math.max(1, ...data.map((point) => valueOf(point)));
  const baseline = padY + innerH;
  // 15% headroom above the peak so the max point never touches the top edge.
  const scaleMax = max * 1.15;

  const pts = data.map((point, i) => ({
    x: data.length > 1 ? padX + (i / (data.length - 1)) * innerW : 50,
    y: padY + (1 - valueOf(point) / scaleMax) * innerH,
  }));

  const line = smoothPath(pts, padY, baseline);
  const area = pts.length
    ? `${line} L${pts[pts.length - 1].x.toFixed(2)},${baseline} L${pts[0].x.toFixed(2)},${baseline} Z`
    : "";

  // The busiest bucket — highlighted with a bigger glowing, pulsing dot.
  let peak = 0;
  data.forEach((point, i) => {
    if (valueOf(point) > valueOf(data[peak])) peak = i;
  });
  const hasPlays = data.some((point) => valueOf(point) > 0);
  // Tooltip / max-label text for the active metric ("3 plays", "2 games", "1h 20m").
  const describe = (value: number) =>
    metric === "time" ? cfg.format(value) : `${cfg.format(value)} ${cfg.noun}`;

  // Evenly spaced x-axis ticks (~5).
  const tickCount = Math.min(5, data.length);
  const ticks = tickCount > 1
    ? Array.from({ length: tickCount }, (_, i) => Math.round((i / (tickCount - 1)) * (data.length - 1)))
    : data.map((_, i) => i);

  // Y-axis scale labels (left side), formatted for the active metric — max,
  // midpoint, and 0 — positioned at their real value height. Deduped so a tiny
  // range (e.g. max 1) doesn't repeat the same label.
  const yFor = (value: number) => padY + (1 - value / scaleMax) * innerH;
  const seenTick = new Set<string>();
  const yTicks = [max, max / 2, 0]
    .map((value) => ({ value, label: cfg.format(value), y: yFor(value) }))
    .filter((tick) => (seenTick.has(tick.label) ? false : (seenTick.add(tick.label), true)));

  const active = hover ?? (hasPlays ? peak : null);

  const handleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (data.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHover(Math.round(frac * (data.length - 1)));
  };

  const heightClass = "h-52 sm:h-44";

  return (
    <div className="flex w-full">
      {/* Y-axis scale labels (left) */}
      <div className={`relative ${heightClass} w-9 shrink-0`}>
        {yTicks.map((tick) => (
          <span
            key={tick.label}
            className="absolute right-1.5 -translate-y-1/2 whitespace-nowrap text-[10px] font-bold text-violet-200/50"
            style={{ top: `${tick.y}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>

      {/* Plot */}
      <div
        className={`relative ${heightClass} flex-1 touch-none`}
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={() => setHover(null)}
      >
      <style>{`
        @keyframes kd-pulse { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.4); opacity: 0; } }
      `}</style>
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="kd-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d946ef" stopOpacity="0.26" />
            <stop offset="55%" stopColor="#a855f7" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines (aligned to the y-axis scale labels) */}
        {yTicks.map((tick) => (
          <line
            key={tick.label}
            x1={padX}
            x2={100 - padX}
            y1={tick.y}
            y2={tick.y}
            stroke="#ffffff"
            strokeOpacity="0.07"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {area && <path d={area} fill="url(#kd-fill)" />}
        {line && (
          <path
            key={`${series.range}-${metric}-${data.length}`}
            d={line}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{
              filter: "drop-shadow(0 0 3px rgba(56,189,248,0.9))",
            }}
          />
        )}
      </svg>

      {/* Peak marker (pulsing) */}
      {hasPlays && hover === null && (
        <div
          className="pointer-events-none absolute"
          style={{ left: `${pts[peak].x}%`, top: `${pts[peak].y}%`, transform: "translate(-50%,-50%)" }}
        >
          <span
            className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400"
            style={{ animation: "kd-pulse 1.6s ease-out infinite" }}
          />
          <span className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_2px_rgba(56,189,248,0.95)]" />
        </div>
      )}

      {/* Hover marker + tooltip */}
      {hover !== null && active !== null && (
        <>
          <div
            className="pointer-events-none absolute top-0 bottom-6 w-px bg-white/20"
            style={{ left: `${pts[active].x}%` }}
          />
          <div
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_2px_rgba(56,189,248,0.95)]"
            style={{ left: `${pts[active].x}%`, top: `${pts[active].y}%` }}
          />
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-fuchsia-400/40 bg-[#0b0419]/95 px-2 py-1 text-center shadow-lg"
            style={{
              left: `${Math.min(88, Math.max(12, pts[active].x))}%`,
              top: `${Math.max(10, pts[active].y - 6)}%`,
            }}
          >
            <p className="text-xs font-black leading-none text-white">
              {describe(valueOf(data[active]))}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold leading-none text-violet-200/70">
              {data[active].label}
            </p>
          </div>
        </>
      )}

        {/* X-axis ticks */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-[3%] text-[10px] font-semibold text-violet-200/50">
          {ticks.map((idx) => (
            <span key={idx}>{data[idx]?.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-fuchsia-400/25 bg-[#170436] p-4 shadow-[0_8px_20px_rgba(28,4,64,0.3)]">
      <p className="text-[11px] font-bold uppercase tracking-wide text-violet-200/70">{label}</p>
      <p className="mt-1 font-display text-2xl font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState<CreatorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("analytics");
  const [range, setRange] = useState<DashboardRange>("week");
  // KultPoints shown here comes from the SAME point summary as the header/profile
  // (one identity's balance), so the Earn card always matches what the user sees
  // elsewhere — not the cross-identity lifetime sum.
  const [kultPoints, setKultPoints] = useState(0);
  const signedIn = Boolean(getCurrentUserId());
  const navigate = useNavigate();
  const openGame = (gameId: string) =>
    navigate({ to: "/play/$gameId", params: { gameId } });

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;
    fetchPointSummary(userId)
      .then((summary) => setKultPoints(summary.kultPoints ?? summary.lifetimePoints ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    if (!signedIn) {
      setLoading(false);
      return;
    }
    // Full spinner only on first load; range switches keep the old chart visible.
    if (data) setRangeLoading(true);
    else setLoading(true);
    fetchCreatorDashboard(range)
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError("Could not load your dashboard. Please try again.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRangeLoading(false);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, range]);

  const earners = useMemo(
    () => (data?.games ?? [])
      .filter((game) => game.earned > 0 || Number(game.kpEarned) > 0)
      .sort((a, b) => Math.max(b.earned, Number(b.kpEarned) || 0) - Math.max(a.earned, Number(a.kpEarned) || 0)),
    [data],
  );

  return (
    <div className="min-h-[100dvh] w-full pb-24">
      <PageHeader title="Dashboard" subtitle="Analytics, Activities, and earnings for your games." />

      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        {/* Tabs */}
        <div className="mb-5 flex gap-2 rounded-2xl border border-fuchsia-400/25 bg-[#170436] p-1 shadow-[0_8px_20px_rgba(28,4,64,0.3)]">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition ${
                tab === key
                  ? "bg-[linear-gradient(135deg,#7c3aed,#d946ef)] text-white shadow-[0_2px_14px_rgba(217,70,239,0.4)]"
                  : "text-violet-200/70 hover:text-white"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {!signedIn ? (
          <EmptyState text="Sign in to see your games' analytics, comments, and earnings." />
        ) : loading ? (
          <div className="grid place-items-center py-20 text-violet-200/70">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : error ? (
          <EmptyState text={error} />
        ) : (
          <>
            {tab === "analytics" && (
              <AnalyticsTab
                data={data!}
                range={range}
                onRangeChange={setRange}
                rangeLoading={rangeLoading}
                onOpenGame={openGame}
              />
            )}
            {tab === "activity" && <ActivityTab data={data!} onOpenGame={openGame} />}
            {tab === "earn" && (
              <EarnTab
                earners={earners}
                total={data!.totals.earned}
                kultPoints={kultPoints}
                series={data!.series}
                onOpenGame={openGame}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({
  data,
  range,
  onRangeChange,
  rangeLoading,
  onOpenGame,
}: {
  data: CreatorDashboard;
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
  rangeLoading: boolean;
  onOpenGame: (gameId: string) => void;
}) {
  const caption = RANGE_OPTIONS.find((option) => option.value === range)?.caption ?? "";
  const [showAllGames, setShowAllGames] = useState(false);
  const [metric, setMetric] = useState<MetricKey>("plays");
  const visibleGames = showAllGames ? data.games : data.games.slice(0, COLLAPSED_GAME_COUNT);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Plays" value={formatNumber(data.totals.plays)} />
        <StatCard label="Comments" value={formatNumber(data.totals.comments)} />
        <StatCard label="Creator Score Earned" value={formatNumber(data.totals.earned)} />
        <StatCard label="Games" value={formatNumber(data.totals.games)} />
      </div>

      <div className="rounded-2xl border border-fuchsia-400/25 bg-[#170436] p-4 shadow-[0_8px_20px_rgba(28,4,64,0.3)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white">{METRICS[metric].label}</p>
            {rangeLoading && <Loader2 className="size-3.5 animate-spin text-violet-200/60" />}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={metric}
                onChange={(event) => setMetric(event.target.value as MetricKey)}
                aria-label="Chart metric"
                className="appearance-none rounded-full border border-fuchsia-400/30 bg-[#0b0419] py-1.5 pl-3 pr-8 text-xs font-bold text-white outline-none transition hover:border-fuchsia-300/50 focus:border-fuchsia-300/60"
              >
                {METRIC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#0b0419] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-violet-200/70" />
            </div>
            <div className="relative">
              <select
                value={range}
                onChange={(event) => onRangeChange(event.target.value as DashboardRange)}
                aria-label="Analytics time range"
                className="appearance-none rounded-full border border-fuchsia-400/30 bg-[#0b0419] py-1.5 pl-3 pr-8 text-xs font-bold text-white outline-none transition hover:border-fuchsia-300/50 focus:border-fuchsia-300/60"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#0b0419] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-violet-200/70" />
            </div>
          </div>
        </div>
        <p className="mb-3 text-[11px] font-semibold text-violet-200/50">
          {METRICS[metric].axis} · {caption}
        </p>
        <PlaysChart series={data.series} metric={metric} />
      </div>

      <div>
        <p className="mb-2 px-1 text-sm font-black text-white">Per game</p>
        {data.games.length === 0 ? (
          <EmptyState text="No games yet. Create one to start collecting plays." />
        ) : (
          <>
            <div className="space-y-2">
              {visibleGames.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => onOpenGame(game.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-fuchsia-400/20 bg-[#170436] p-2.5 text-left shadow-[0_8px_20px_rgba(28,4,64,0.24)] transition hover:border-fuchsia-300/45 hover:bg-[#21074b] active:scale-[0.99]"
                >
                  <GameThumb id={game.id} title={game.title} thumbnailUrl={game.thumbnailUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{game.title}</p>
                    <p className="text-[11px] font-semibold text-violet-200/60">
                      {game.published ? "Published" : "Draft"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-black tabular-nums text-white">
                      {formatNumber(game.plays)}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/50">
                      plays
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {data.games.length > COLLAPSED_GAME_COUNT && (
              <ViewAllButton
                expanded={showAllGames}
                total={data.games.length}
                onToggle={() => setShowAllGames((current) => !current)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// One comment row (used inside cards and the "view all" modal).
function CommentRow({
  username,
  text,
  createdAt,
}: {
  username: string;
  text: string;
  createdAt: string;
}) {
  return (
    <div className="rounded-xl border border-fuchsia-400/15 bg-[#0b0419] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-black text-white">{username}</p>
        <span className="shrink-0 text-[10px] font-semibold text-violet-200/50">
          {timeAgo(createdAt)}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-violet-100/90">{text}</p>
    </div>
  );
}

function StatPill({
  icon: Icon,
  color,
  value,
}: {
  icon: typeof Play;
  color: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-[#0b0419] px-2 py-1">
      <Icon className={`size-3.5 ${color}`} />
      <span className="text-xs font-black tabular-nums text-white">{formatNumber(value)}</span>
    </div>
  );
}

function ActivityGameCard({
  game,
  onViewAll,
  onOpen,
}: {
  game: DashboardGame;
  onViewAll: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-2xl border border-fuchsia-400/20 bg-[#170436] p-3 shadow-[0_8px_20px_rgba(28,4,64,0.24)]">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-xl text-left transition hover:opacity-90 active:scale-[0.99]"
      >
        <GameThumb id={game.id} title={game.title} thumbnailUrl={game.thumbnailUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{game.title}</p>
          <p className="text-[11px] font-semibold text-violet-200/60">
            {game.published ? "Published" : "Draft"}
          </p>
        </div>
      </button>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatPill icon={Play} color="text-cyan-300" value={game.plays} />
        <StatPill icon={Heart} color="text-rose-300" value={game.likes} />
        <StatPill icon={MessageCircle} color="text-fuchsia-300" value={game.comments} />
        <StatPill icon={Share2} color="text-emerald-300" value={game.shares} />
        <StatPill icon={Repeat2} color="text-amber-300" value={game.remixes} />
      </div>

      {game.recentComments.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {game.recentComments.map((comment) => (
            <CommentRow
              key={comment.id}
              username={comment.username}
              text={comment.text}
              createdAt={comment.createdAt}
            />
          ))}
          {game.comments > game.recentComments.length && (
            <button
              type="button"
              onClick={onViewAll}
              className="w-full rounded-xl border border-fuchsia-400/25 bg-[#0b0419] py-2 text-xs font-bold text-violet-100 transition hover:border-fuchsia-300/50 hover:text-white active:scale-[0.99]"
            >
              View all {game.comments} comments
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CommentsModal({ game, onClose }: { game: DashboardGame; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchComments(game.id, 1, 100)
      .then((page) => {
        if (active) setComments(page.comments);
      })
      .catch(() => {
        if (active) setComments([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [game.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-3xl border border-fuchsia-400/30 bg-[#100528] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-fuchsia-400/15 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{game.title}</p>
            <p className="text-[11px] font-semibold text-violet-200/60">
              {formatNumber(game.comments)} comments
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white transition hover:border-fuchsia-300/50"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {loading ? (
            <div className="grid place-items-center py-12 text-violet-200/70">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-12 text-center text-sm text-violet-200/60">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <CommentRow
                key={comment._id}
                username={comment.username || "Anonymous"}
                text={comment.text}
                createdAt={comment.createdAt}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityTab({
  data,
  onOpenGame,
}: {
  data: CreatorDashboard;
  onOpenGame: (gameId: string) => void;
}) {
  const [modalGame, setModalGame] = useState<DashboardGame | null>(null);
  // Surface the games with the most social action first.
  const games = useMemo(
    () =>
      [...data.games].sort(
        (a, b) => b.likes + b.comments + b.shares + b.remixes - (a.likes + a.comments + a.shares + a.remixes),
      ),
    [data.games],
  );

  const summary = [
    { label: "Likes", value: data.totals.likes, icon: Heart, color: "text-rose-300" },
    { label: "Comments", value: data.totals.comments, icon: MessageCircle, color: "text-fuchsia-300" },
    { label: "Shares", value: data.totals.shares, icon: Share2, color: "text-emerald-300" },
    { label: "Remixes", value: data.totals.remixes, icon: Repeat2, color: "text-amber-300" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-fuchsia-400/25 bg-[#170436] p-4 text-center shadow-[0_8px_20px_rgba(28,4,64,0.3)]">
            <Icon className={`mx-auto size-5 ${color}`} />
            <p className="mt-1.5 font-display text-2xl font-black tabular-nums text-white">
              {formatNumber(value)}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-violet-200/60">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 px-1 text-sm font-black text-white">Your games</p>
        {games.length === 0 ? (
          <EmptyState text="No games yet. Create one to start collecting activity." />
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <ActivityGameCard
                key={game.id}
                game={game}
                onViewAll={() => setModalGame(game)}
                onOpen={() => onOpenGame(game.id)}
              />
            ))}
          </div>
        )}
      </div>

      {modalGame && <CommentsModal game={modalGame} onClose={() => setModalGame(null)} />}
    </div>
  );
}

function EarnTab({
  earners,
  total,
  kultPoints,
  series,
  onOpenGame,
}: {
  earners: CreatorDashboard["games"];
  total: number;
  kultPoints: number;
  series: DashboardSeries;
  onOpenGame: (gameId: string) => void;
}) {
  const [historyMetric, setHistoryMetric] = useState<"all" | "kp" | "cs">("all");
  const historyEntries = earners.flatMap((game) => {
    const entries: { game: DashboardGame; metric: "kp" | "cs"; value: number }[] = [];
    if ((historyMetric === "all" || historyMetric === "cs") && game.earned > 0) {
      entries.push({ game, metric: "cs", value: game.earned });
    }
    if ((historyMetric === "all" || historyMetric === "kp") && Number(game.kpEarned) > 0) {
      entries.push({ game, metric: "kp", value: Number(game.kpEarned) });
    }
    return entries;
  }).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-amber-300/35 bg-[linear-gradient(145deg,#2b170c,#170436)] p-4 text-center shadow-[0_8px_20px_rgba(28,4,64,0.3)]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-100/80">
            Creator Score Earned
          </p>
          <p className="mt-1 font-display text-3xl font-black tabular-nums text-white">
            {formatNumber(total)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-amber-100/70">Creator Score</p>
        </div>
        <div className="rounded-2xl border border-fuchsia-300/35 bg-[linear-gradient(145deg,#2a0d58,#170436)] p-4 text-center shadow-[0_8px_20px_rgba(28,4,64,0.3)]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-fuchsia-100/80">
            KultPoints Earned
          </p>
          <p className="mt-1 font-display text-3xl font-black tabular-nums text-white">
            {formatNumber(kultPoints)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-fuchsia-100/70">KultPoints</p>
        </div>
      </div>

      <EarningsChart series={series} metric={historyMetric} />

      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="font-display text-lg font-black text-white">History</h3>
        <div className="relative">
          <select
            value={historyMetric}
            onChange={(event) => setHistoryMetric(event.target.value as "all" | "kp" | "cs")}
            aria-label="Earnings history type"
            className="appearance-none rounded-full border border-fuchsia-400/30 bg-[#0b0419] py-1.5 pl-3 pr-8 text-xs font-black uppercase text-white outline-none focus:border-fuchsia-300/60"
          >
            <option value="all" className="bg-[#0b0419] text-white">All</option>
            <option value="kp" className="bg-[#0b0419] text-white">KP</option>
            <option value="cs" className="bg-[#0b0419] text-white">CS</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-violet-200/70" />
        </div>
      </div>

      {historyEntries.length === 0 ? (
        <EmptyState
          text={historyMetric === "all"
            ? "No earnings history yet."
            : historyMetric === "cs"
            ? "No Creator Score history yet."
            : "No KultPoints history for these games yet."}
        />
      ) : (
        <div className="space-y-2">
          {historyEntries.map(({ game, metric, value }) => (
            <button
              key={`${game.id}-${metric}`}
              type="button"
              onClick={() => onOpenGame(game.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-fuchsia-400/20 bg-[#170436] p-2.5 text-left shadow-[0_8px_20px_rgba(28,4,64,0.24)] transition hover:border-fuchsia-300/45 hover:bg-[#21074b] active:scale-[0.99]"
            >
              <GameThumb id={game.id} title={game.title} thumbnailUrl={game.thumbnailUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{game.title}</p>
                <p className="text-[11px] font-semibold text-violet-200/60">
                  {formatNumber(game.plays)} plays
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-black tabular-nums text-amber-200">
                  {formatNumber(value)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/50">
                  {metric.toUpperCase()} earned
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EarningsChart({
  series,
  metric,
}: {
  series: DashboardSeries;
  metric: "all" | "kp" | "cs";
}) {
  const data = series.points;
  const [hover, setHover] = useState<number | null>(null);
  const padX = 3;
  const padTop = 12;
  const padBottom = 19;
  const innerW = 100 - padX * 2;
  const innerH = 100 - padTop - padBottom;
  const csValues = data.map((point) => Number(point.earned) || 0);
  const kpValues = data.map((point) => Number(point.kpEarned) || 0);
  const csMax = Math.max(1, ...csValues);
  const kpMax = Math.max(1, ...kpValues);
  const pointsFor = (values: number[], max: number) =>
    values.map((value, index) => ({
      x: data.length > 1 ? padX + (index / (data.length - 1)) * innerW : 50,
      y: padTop + (1 - value / (max * 1.12)) * innerH,
    }));
  const csPoints = pointsFor(csValues, csMax);
  const kpPoints = pointsFor(kpValues, kpMax);
  const csPath = smoothPath(csPoints, padTop, padTop + innerH);
  const kpPath = smoothPath(kpPoints, padTop, padTop + innerH);
  const tickCount = Math.min(5, data.length);
  const ticks = tickCount > 1
    ? Array.from({ length: tickCount }, (_, index) =>
        Math.round((index / (tickCount - 1)) * (data.length - 1)))
    : data.map((_, index) => index);

  const handleMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!data.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHover(Math.round(fraction * (data.length - 1)));
  };

  return (
    <div className="rounded-2xl border border-fuchsia-400/25 bg-[#170436] p-4 shadow-[0_8px_20px_rgba(28,4,64,0.3)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-white">Earnings</p>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          {(metric === "all" || metric === "kp") && <span className="flex items-center gap-1.5 text-amber-100">
            <i className="size-2 rounded-full bg-amber-300 shadow-[0_0_7px_#fcd34d]" /> KP
          </span>}
          {(metric === "all" || metric === "cs") && <span className="flex items-center gap-1.5 text-fuchsia-100">
            <i className="size-2 rounded-full bg-fuchsia-400 shadow-[0_0_7px_#e879f9]" /> CS
          </span>}
        </div>
      </div>
      <div
        className="relative h-48 w-full touch-none sm:h-44"
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full overflow-visible">
          {[padTop, padTop + innerH / 2, padTop + innerH].map((y) => (
            <line
              key={y}
              x1={padX}
              x2={100 - padX}
              y1={y}
              y2={y}
              stroke="white"
              strokeOpacity=".08"
              strokeWidth=".5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {(metric === "all" || metric === "kp") && kpPath && (
            <path
              d={kpPath}
              fill="none"
              stroke="#fcd34d"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ filter: "drop-shadow(0 0 3px rgba(252,211,77,.8))" }}
            />
          )}
          {(metric === "all" || metric === "cs") && csPath && (
            <path
              d={csPath}
              fill="none"
              stroke="#e879f9"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ filter: "drop-shadow(0 0 3px rgba(232,121,249,.8))" }}
            />
          )}
        </svg>

        {hover !== null && data[hover] && (
          <>
            <div
              className="pointer-events-none absolute bottom-7 top-3 w-px bg-white/20"
              style={{ left: `${csPoints[hover].x}%` }}
            />
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-fuchsia-400/35 bg-[#0b0419]/95 px-2.5 py-1.5 text-center shadow-xl"
              style={{
                left: `${Math.min(85, Math.max(15, csPoints[hover].x))}%`,
                top: `${Math.max(25, Math.min(csPoints[hover].y, kpPoints[hover].y) - 3)}%`,
              }}
            >
              <p className="text-[11px] font-black text-amber-200">
                {(metric === "all" || metric === "kp") && <span>{formatNumber(kpValues[hover])} KP</span>}
                {metric === "all" && <span className="mx-1.5 text-white/25">•</span>}
                {(metric === "all" || metric === "cs") && (
                  <span className="text-fuchsia-200">{formatNumber(csValues[hover])} CS</span>
                )}
              </p>
              <p className="text-[9px] font-semibold text-violet-200/60">{data[hover].label}</p>
            </div>
          </>
        )}

        <div className="absolute inset-x-[3%] bottom-0 flex justify-between text-[9px] font-semibold text-violet-200/50">
          {ticks.map((index) => <span key={index}>{data[index]?.label}</span>)}
        </div>
      </div>
    </div>
  );
}

function ViewAllButton({
  expanded,
  total,
  onToggle,
}: {
  expanded: boolean;
  total: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-fuchsia-400/25 bg-[#170436] py-2.5 text-sm font-bold text-violet-100 shadow-[0_8px_20px_rgba(28,4,64,0.24)] transition hover:border-fuchsia-300/50 hover:bg-[#21074b] hover:text-white active:scale-[0.99]"
    >
      {expanded ? "Show less" : `View all ${total} games`}
      <ChevronDown
        className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-fuchsia-400/20 bg-[#170436] px-6 py-14 text-center shadow-[0_8px_20px_rgba(28,4,64,0.3)]">
      <p className="text-sm font-semibold text-violet-200/70">{text}</p>
    </div>
  );
}
