import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/studio/PageHeader";
import { ArrowUpRight, Play } from "lucide-react";
import { gameTemplates } from "@/lib/templates";
import { gradientClass } from "@/lib/games-data";
import { gradientForId, templateEmoji, engineOf, getThumbnailUrl } from "@/lib/studio-meta";
import { useStudioContext } from "@/context/StudioContext";
import profileBg from "@/assets/profile-bg.png";

export const Route = createFileRoute("/_app/templates")({
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
  const list = gameTemplates.filter((t: any) => engineOf(t) === studio.engine);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4ddff] text-violet-950">
      <img
        src={profileBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-top"
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_6%,rgba(255,255,255,0.62),transparent_26%),radial-gradient(circle_at_16%_38%,rgba(244,114,182,0.24),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.24),rgba(216,180,254,0.2))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.5)_42%,transparent_62%)] opacity-70" />

      <div className="relative z-10 hidden sm:block">
        <PageHeader title="Templates" subtitle="Pick a base · Remix with a prompt · Ship instantly" />
      </div>

      <div className="relative z-10 px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <section className="overflow-hidden rounded-[1.65rem] border-2 border-fuchsia-200 bg-[#100528] px-5 py-4 text-center shadow-[0_6px_0_rgba(65,24,138,0.75),0_0_34px_rgba(217,70,239,0.9),inset_0_1px_18px_rgba(255,255,255,0.16)] sm:hidden">
          <p className="font-display text-3xl font-black text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)]">
            Templates
          </p>
          <p className="mt-1 text-xs font-black text-violet-100">Pick a base. Remix it. Ship instantly.</p>
        </section>

        <div className="mt-5 flex items-center justify-center sm:mt-0 sm:justify-start">
          <div className="inline-flex rounded-2xl border-2 border-violet-300/70 bg-white/70 p-1 shadow-[0_0_18px_rgba(168,85,247,0.24),inset_0_1px_8px_rgba(255,255,255,0.9)] backdrop-blur">
          {engines.map((e) => (
            <button
              key={e.id}
              onClick={() => studio.setEngine(e.id)}
              className={`rounded-xl px-5 py-2 font-display text-xs font-black transition-all ${
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

      <div className="relative z-10 grid grid-cols-1 gap-5 px-4 py-8 sm:grid-cols-2 sm:px-6 md:grid-cols-3 xl:grid-cols-4 lg:px-10">
        {list.map((t: any, i: number) => (
          <article
            key={t.id}
            className="animate-float-up group overflow-hidden rounded-[1.5rem] border-2 border-fuchsia-200/80 bg-white/80 shadow-[0_10px_24px_rgba(124,58,237,0.18),0_0_20px_rgba(217,70,239,0.18),inset_0_1px_10px_rgba(255,255,255,0.9)] backdrop-blur transition-all hover:-translate-y-1 hover:border-fuchsia-300 hover:shadow-[0_14px_30px_rgba(124,58,237,0.24),0_0_26px_rgba(217,70,239,0.32)]"
            style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
          >
            <div className={`relative flex aspect-[16/12] items-center justify-center overflow-hidden bg-gradient-to-br ${gradientClass[gradientForId(t.id)]}`}>
              {getThumbnailUrl(t.id) ? (
                <>
                  <img
                    src={getThumbnailUrl(t.id)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
                </>
              ) : (
                <span className="text-6xl transition-transform group-hover:scale-110">{templateEmoji[t.id] ?? "🎮"}</span>
              )}
              <div className="absolute inset-x-3 bottom-3 h-10 rounded-full bg-white/18 blur-xl" />
            </div>
            <div className="p-5">
              <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-600">{t.category}</span>
              <h3 className="mt-3 font-display text-xl font-black text-violet-950">{t.name}</h3>
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-violet-700/75">{t.mechanic}</p>
              <button
                onClick={() => navigate({ to: "/play/$gameId", params: { gameId: t.id } })}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300/70 bg-white/70 py-2.5 text-xs font-black uppercase tracking-wider text-violet-700 shadow-[inset_0_1px_8px_rgba(255,255,255,0.9)] transition-colors hover:border-violet-500 hover:text-violet-950"
              >
                Play Template <Play className="size-4" />
              </button>
              <button
                onClick={() => openInStudio(t.id)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#a855f7,#ec4899)] py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_8px_18px_rgba(168,85,247,0.34)] transition-opacity hover:opacity-90"
              >
                Use Template <ArrowUpRight className="size-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
      </div>
    </div>
  );
}
