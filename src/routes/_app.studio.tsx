import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/studio/PageHeader";
import { GamePreview } from "@/components/studio/GamePreview";
import { UnityPreview } from "@/components/studio/UnityPreview";
import { Html5Preview } from "@/components/studio/Html5Preview";
import { useStudioContext } from "@/context/StudioContext";
import { api } from "@/lib/api";
import { templateEmoji } from "@/lib/studio-meta";
import {
  Copy, Download, FileCode2, Rocket, Sparkles, SlidersHorizontal, Play,
  Clock3, CheckCircle2, Braces, Wand2, Bot, BadgeCheck, Gamepad2, Palette, Settings2,
} from "lucide-react";

export const Route = createFileRoute("/_app/studio")({
  head: () => ({
    meta: [
      { title: "Studio — Creator Studio" },
      { name: "description", content: "Live build space: preview, tune, refine with agents, and export your game." },
    ],
  }),
  component: Studio,
});

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function Studio() {
  const { studio } = useStudioContext();
  const pkg = studio.generatedPackage;

  const copyPackage = () => navigator.clipboard.writeText(JSON.stringify(pkg, null, 2));
  const downloadPackage = () => downloadJson(pkg, `${slug(pkg.title)}.json`);

  const downloadTemplatePack = async () => {
    const bundle = await studio.getTemplateExport();
    downloadJson(bundle, "kult-template-pack.json");
  };

  const downloadGameCode = async () => {
    try {
      const response = await api.post(
        "/games/export-code",
        { gamePackage: pkg },
        { responseType: "blob", timeout: 30000 },
      );
      const disposition = response.headers["content-disposition"];
      const match = disposition?.match(/filename="([^"]+)"/);
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = match?.[1] ?? `${slug(pkg.title)}-source.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // Backend unavailable — fall back to the JSON package so the action still works.
      downloadPackage();
    }
  };

  const ghost =
    "flex items-center gap-2 rounded-xl border border-border/70 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-foreground";
  const ai =
    "flex items-center justify-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary";

  return (
    <div>
      <PageHeader title="Studio" subtitle={`Live Build · ${pkg.title}`} />

      <div className="space-y-6 px-6 py-8 lg:px-10">
        {/* Topbar actions */}
        <div className="animate-float-up flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-card">
          <div className="min-w-0">
            <span className="label-mono text-[9px] text-primary">Live Build</span>
            <h2 className="truncate font-display text-xl font-black">{pkg.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className={ghost} onClick={copyPackage}><Copy className="size-4" /> Copy</button>
            <button className={ghost} onClick={downloadPackage}><Download className="size-4" /> Save</button>
            <button className={ghost} onClick={downloadGameCode}><FileCode2 className="size-4" /> Code</button>
            <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.65_0.25_295)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90">
              <Rocket className="size-4" /> Publish
            </button>
          </div>
        </div>

        {/* Template chips */}
        <div className="animate-float-up rounded-2xl border border-border/60 bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold"><Sparkles className="size-4 text-primary" /> Selected template</h3>
            <button className={ghost} onClick={downloadTemplatePack}><Download className="size-3.5" /> All</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {studio.templates.slice(0, 8).map((t: any) => (
              <button
                key={t.id}
                onClick={() => studio.setSelectedId(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  studio.selectedId === t.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-primary/50"
                }`}
              >
                <span className="text-lg">{templateEmoji[t.id] ?? "🎮"}</span>
                <strong className="font-display text-xs font-bold">{t.name}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* Preview + controls */}
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="animate-float-up rounded-2xl border border-border/60 bg-card p-4 shadow-card">
            <div className="overflow-hidden rounded-xl">
              {studio.engine === "unity" ? (
                <UnityPreview templateId={pkg.templateId} />
              ) : studio.engine === "construct" ? (
                <Html5Preview templateId={pkg.templateId} />
              ) : (
                <GamePreview gamePackage={pkg} />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs"><Clock3 className="size-3.5 text-primary" /> {pkg.createdIn}</span>
              <span className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs"><CheckCircle2 className="size-3.5 text-[oklch(0.85_0.2_150)]" /> {pkg.reliability}</span>
              <span className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs"><Braces className="size-3.5 text-primary" /> {studio.packageMode}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="animate-float-up rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-bold"><SlidersHorizontal className="size-4 text-primary" /> Customize</h3>
            <label className="label-mono mb-1.5 block text-[10px] text-muted-foreground">Creator Prompt</label>
            <textarea
              value={studio.prompt}
              onChange={(e) => studio.setPrompt(e.target.value)}
              onBlur={studio.createFromTemplate}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background/60 p-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Theme">
                <select value={studio.theme} onChange={(e) => studio.setTheme(e.target.value)} className={selectCls}>
                  {Object.entries(studio.themePresets).map(([k, p]: [string, any]) => (
                    <option key={k} value={k}>{p.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Difficulty">
                <select value={studio.difficulty} onChange={(e) => studio.setDifficulty(e.target.value)} className={selectCls}>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                  <option value="insane">Insane</option>
                </select>
              </Field>
              <Field label="Customization">
                <select value={studio.customization} onChange={(e) => studio.setCustomization(e.target.value)} className={selectCls}>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </Field>
              <Field label="Extra">
                <select value={studio.extra} onChange={(e) => studio.setExtra(e.target.value)} className={selectCls}>
                  <option value="none">None</option>
                  <option value="powerups">Powerups</option>
                  <option value="leaderboard">Leaderboard</option>
                  <option value="boss">Boss Mode</option>
                </select>
              </Field>
            </div>
            <button
              onClick={studio.createFromTemplate}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.65_0.25_295)] py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Play className="size-4" /> Create From Template
            </button>
          </div>
        </div>

        {/* Game kit + AI pipeline */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="animate-float-up rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-bold"><BadgeCheck className="size-4 text-primary" /> Game Kit</h3>
            <div className="space-y-3">
              <KitRow icon={<Gamepad2 className="size-4 text-primary" />} label="Mechanic" value={pkg.gameplay?.mechanic} />
              <KitRow icon={<Settings2 className="size-4 text-primary" />} label="Controls" value={pkg.gameplay?.controls} />
              <KitRow icon={<Palette className="size-4 text-primary" />} label="Assets" value={pkg.visuals?.assets} />
            </div>
          </div>

          <div className="animate-float-up rounded-2xl border border-border/60 bg-card p-5 shadow-card">
            <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold"><Wand2 className="size-4 text-primary" /> AI Agent Pipeline</h3>
            <p className="text-sm text-muted-foreground">{studio.agentStatus}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button className={ai} onClick={studio.orchestrateBuild}><Bot className="size-4" /> Plan</button>
              <button className={ai} onClick={studio.refineWithAi}><Sparkles className="size-4" /> Code</button>
              <button className={ai} onClick={studio.generateAssets}><Wand2 className="size-4" /> Assets</button>
            </div>
            <ol className="mt-4 space-y-2">
              <FlowStep done>Template selected</FlowStep>
              <FlowStep done>Package generated</FlowStep>
              <FlowStep done={!!studio.orchestrationPlan}>Backend orchestration</FlowStep>
              <FlowStep done={!!(pkg as any).refinement}>Code agent response</FlowStep>
              <FlowStep done={!!studio.assetResult}>Image asset agent</FlowStep>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}

const selectCls =
  "w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-mono mb-1.5 block text-[10px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function KitRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/40 p-3">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="label-mono text-[9px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FlowStep({ done, children }: { done?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className={`flex size-5 items-center justify-center rounded-full border ${done ? "border-[oklch(0.85_0.2_150)]" : "border-border/70"}`}>
        {done && <CheckCircle2 className="size-3 text-[oklch(0.85_0.2_150)]" />}
      </span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
