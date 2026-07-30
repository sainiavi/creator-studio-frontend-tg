import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/studio/PageHeader";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import { gradientClass } from "@/lib/games-data";
import { gradientForId, templateEmoji, engineOf, getThumbnailUrl } from "@/lib/studio-meta";
import { useStudioContext } from "@/context/StudioContext";
import { useGameTemplates } from "@/hooks/useGameTemplates";
import { TemplatesGridSkeleton } from "@/components/studio/PageSkeletons";
import categoryStrategyIcon from "@/assets/categoryStrategy.webp";
import categoryArcadeIcon from "@/assets/categoryArcade.webp";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_app/templates")({
  pendingComponent: TemplatesGridSkeleton,
  head: () => ({
    meta: [
      { title: "Templates — Creator Studio" },
      { name: "description", content: "Start from a ready-made game template and remix it with a prompt." },
    ],
  }),
  component: Templates,
});

const engines = [
  {
    id: "threejs",
    label: "3D Games",
    description: "Explore immersive worlds",
    image: categoryStrategyIcon,
    accent: "text-sky-400",
  },
  {
    id: "construct",
    label: "Quick Games",
    description: "Jump in and play",
    image: categoryArcadeIcon,
    accent: "text-violet-300",
  },
] as const;

function Templates() {
  const { studio, openInStudio } = useStudioContext();
  const navigate = useNavigate();
  const { gameTemplates, loading } = useGameTemplates();
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set());
  const list = useMemo(
    () => gameTemplates.filter((t: any) => engineOf(t) === studio.engine),
    [gameTemplates, studio.engine],
  );

  const markImageFailed = (templateId: string) => {
    setFailedImageIds((current) => {
      if (current.has(templateId)) return current;
      const next = new Set(current);
      next.add(templateId);
      return next;
    });
  };

  if (loading) return <TemplatesGridSkeleton />;

  return (
    <div className="relative min-h-screen text-violet-950">
      <PageHeader
        title="Game Templates"
        subtitle="Choose a world, make it yours, and start playing."
      />

      <div className="relative z-10 px-3 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <div className="rounded-[22px] border border-white/20 bg-[#100528]/95 p-2.5 shadow-[0_12px_28px_rgba(49,15,101,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] sm:inline-block sm:p-3">
          <div className="mb-2.5 flex items-center gap-1.5 px-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-fuchsia-200 sm:text-[11px]">
            <Sparkles className="size-3.5 text-fuchsia-400" />
            Pick your game style
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {engines.map((e) => (
              <button
                key={e.id}
                onClick={() => studio.setEngine(e.id)}
                className={`relative flex min-w-0 items-center gap-2 overflow-hidden rounded-[16px] border px-2.5 py-2 text-left transition-all sm:min-w-[190px] sm:px-3 ${
                  studio.engine === e.id
                    ? "border-fuchsia-300 bg-[#281052] shadow-[0_0_18px_rgba(217,70,239,0.28)]"
                    : "border-white/15 bg-[#160b2e] hover:border-violet-300/45 hover:bg-[#1d0f42]"
                }`}
              >
                <span className="grid size-11 shrink-0 place-items-center">
                  <img src={e.image} alt="" className="size-10 object-contain" />
                </span>
                <span className="min-w-0">
                  <span className={`block truncate font-display text-xs font-black ${e.accent}`}>
                    {e.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[9px] font-semibold text-violet-200/65 sm:text-[10px]">
                    {e.description}
                  </span>
                </span>
                {studio.engine === e.id && (
                  <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-fuchsia-400 shadow-[0_0_9px_rgba(232,121,249,0.9)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {list.map((t: any, i: number) => (
            <article
              key={t.id}
              className="animate-float-up group flex flex-col overflow-hidden rounded-[21px] border border-white bg-white/95 shadow-[0_8px_20px_rgba(124,58,237,0.12)] backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(124,58,237,0.2)] sm:rounded-[23px]"
              style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
            >
              <div
                className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br ${gradientClass[gradientForId(t.id)]}`}
              >
                {!failedImageIds.has(String(t.id)) ? (
                  <>
                    <img
                      src={getThumbnailUrl(t.id)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={() => markImageFailed(String(t.id))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                  </>
                ) : (
                  <span className="text-4xl transition-transform group-hover:scale-110 sm:text-5xl">
                    {templateEmoji[t.id] ?? "🎮"}
                  </span>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm sm:left-3 sm:top-3 sm:px-2 sm:text-[10px]">
                  {t.category}
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/play", search: { gameId: t.id } })}
                  aria-label={`Play ${t.name}`}
                  className="absolute inset-0 m-auto grid size-10 place-items-center rounded-full border border-white/50 bg-white/92 text-violet-800 opacity-95 shadow-md transition hover:scale-105 hover:bg-white sm:size-11"
                >
                  <Play className="size-4 fill-current sm:size-[1.125rem]" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[13px] font-bold leading-snug text-violet-950 sm:text-lg">
                    {t.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-violet-700/70 sm:mt-1 sm:text-sm">
                    {t.mechanic}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openInStudio(t.id)}
                  className="flex w-full items-center justify-center gap-1 rounded-full bg-[linear-gradient(135deg,#7c3aed,#db2777)] py-2 text-[11px] font-bold text-white shadow-[0_6px_16px_rgba(124,58,237,0.28)] transition hover:brightness-110 sm:gap-1.5 sm:rounded-xl sm:py-2.5 sm:text-sm"
                >
                  Use template
                  <ArrowUpRight className="size-3.5 opacity-90 sm:size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
