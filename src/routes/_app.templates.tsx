import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/studio/PageHeader";
import { ArrowUpRight, Play } from "lucide-react";
import { gradientClass } from "@/lib/games-data";
import { gradientForId, templateEmoji, engineOf, getThumbnailUrl } from "@/lib/studio-meta";
import { useStudioContext } from "@/context/StudioContext";
import { useGameTemplates } from "@/hooks/useGameTemplates";
import { TemplatesGridSkeleton } from "@/components/studio/PageSkeletons";

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
  { id: "threejs", label: "Three.js" },
  { id: "construct", label: "HTML5" },
] as const;

function Templates() {
  const { studio, openInStudio } = useStudioContext();
  const navigate = useNavigate();
  const { gameTemplates, loading } = useGameTemplates();
  const list = gameTemplates.filter((t: any) => engineOf(t) === studio.engine);

  if (loading) return <TemplatesGridSkeleton />;

  return (
    <div className="relative min-h-screen overflow-hidden text-violet-950">
      <div className="relative z-10">
        <PageHeader title="Templates" subtitle="Pick a base. Remix it. Ship instantly." />
      </div>

      <div className="relative z-10 px-3 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <div className="flex items-center justify-center sm:justify-start">
          <div className="inline-flex rounded-full border-2 border-violet-300/70 bg-white/75 p-1 shadow-[0_0_18px_rgba(168,85,247,0.24),inset_0_1px_8px_rgba(255,255,255,0.9)] backdrop-blur">
            {engines.map((e) => (
              <button
                key={e.id}
                onClick={() => studio.setEngine(e.id)}
                className={`rounded-full px-5 py-2 font-display text-xs font-black transition-all ${
                  studio.engine === e.id
                    ? "bg-[linear-gradient(135deg,#a855f7,#ec4899)] text-white shadow-[0_4px_14px_rgba(168,85,247,0.45)]"
                    : "text-violet-700 hover:text-violet-950"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {list.map((t: any, i: number) => (
            <article
              key={t.id}
              className="animate-float-up group flex flex-col overflow-hidden rounded-[1.25rem] border border-violet-200/80 bg-white/95 shadow-[0_8px_20px_rgba(124,58,237,0.12)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-[0_12px_28px_rgba(124,58,237,0.2)] sm:rounded-[1.35rem]"
              style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
            >
              <div
                className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br ${gradientClass[gradientForId(t.id)]}`}
              >
                {getThumbnailUrl(t.id) ? (
                  <>
                    <img
                      src={getThumbnailUrl(t.id)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
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
                  onClick={() => navigate({ to: "/play/$gameId", params: { gameId: t.id } })}
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
