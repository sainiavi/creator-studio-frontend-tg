import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/studio/PageHeader";
import { GameCard } from "@/components/studio/GameCard";
import { type Game } from "@/lib/games-data";
import { templateEmoji, gradientForId } from "@/lib/studio-meta";
import { useStudioContext } from "@/context/StudioContext";
import { MapPin, Link2, Calendar } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Creator Studio" },
      { name: "description", content: "Your creator profile, stats, and published games." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { createdGames } = useStudioContext();
  const games: Game[] = createdGames.map((g: any) => ({
    title: g.title,
    category: g.category ?? "Game",
    plays: "—",
    emoji: templateEmoji[g.templateId] ?? "🎮",
    gradient: gradientForId(g.templateId ?? g.id),
    creator: "you",
    thumbnailUrl: g.thumbnailUrl,
    templateId: g.templateId,
  }));

  const stats = [
    { label: "Games", value: String(createdGames.length) },
    { label: "Plays", value: "1.6M" },
    { label: "Followers", value: "12.4K" },
    { label: "Likes", value: "98K" },
  ];

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your creator identity · Published games" />
      <div className="px-6 py-8 lg:px-10">
        <div className="animate-float-up overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          <div className="h-32 bg-gradient-to-r from-[oklch(0.72_0.27_340)] via-[oklch(0.65_0.25_295)] to-[oklch(0.82_0.16_195)]" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex items-end justify-between">
              <div className="flex size-24 items-center justify-center rounded-2xl border-4 border-card bg-secondary text-5xl">🎮</div>
            </div>
            <h2 className="mt-4 font-display text-2xl font-black">
              Guest Creator
            </h2>
            <p className="mt-3 max-w-lg text-sm text-muted-foreground">
              Indie game builder. Turning prompts into playable worlds, one neon idea at a time.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> Tokyo</span>
              <span className="flex items-center gap-1.5"><Link2 className="size-3.5" /> vex.games</span>
              <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> Joined 2024</span>
            </div>
            <div className="mt-6 grid grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 bg-background/40 p-3 text-center">
                  <p className="font-display text-lg font-black">{s.value}</p>
                  <p className="label-mono text-[8px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl font-black">Created Games</h2>
        {games.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {games.map((g, i) => (
              <GameCard key={g.title + i} game={g} index={i} />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
            No games yet. Head to <span className="text-primary">Create</span> to generate your first playable build.
          </p>
        )}
      </div>
    </div>
  );
}
