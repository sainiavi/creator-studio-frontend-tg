import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bug,
  Check,
  Loader2,
  Play,
  RotateCcw,
  Rocket,
  Save,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { api } from "@/lib/api";
import { runCodeJob } from "@/hooks/useCreatorStudio";
import { useStudioContext } from "@/context/StudioContext";
import { GamePreview } from "@/components/studio/GamePreview";

export const Route = createFileRoute("/_app/edit/$gameId")({
  head: () => ({
    meta: [
      { title: "Edit Game — Creator Studio" },
      { name: "description", content: "Tweak settings, chat with the agent, and reshape your game." },
    ],
  }),
  component: GameEditor,
});

type ChatMessage = { role: "user" | "assistant"; text: string };
type GameError = { message: string; stack: string };

function GameEditor() {
  const { gameId } = Route.useParams();
  const navigate = useNavigate();
  const { createdGames, addCreatedGame, refreshCreatedGames } = useStudioContext();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [game, setGame] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "This is your game — tell me what to change. Colors, speed, rules, enemies, scoring… anything." },
  ]);
  const [wish, setWish] = useState("");
  const [building, setBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [tab, setTab] = useState<"settings" | "code">("settings");
  const [codeDraft, setCodeDraft] = useState("");
  const [replayKey, setReplayKey] = useState(0);
  const [lastError, setLastError] = useState<GameError | null>(null);
  const buildToken = useRef(0);

  // Load the game: created games first, then the backend by id.
  useEffect(() => {
    const local = createdGames.find((g: any) => g?.id === gameId);
    if (local?.refinement?.generatedCode) {
      setGame(local);
      return;
    }
    api
      .get(`/games/list?q=${encodeURIComponent(gameId)}&limit=1`)
      .then((res) => {
        const found = res.data?.games?.[0];
        if (found?.id === gameId) setGame(found);
        else if (local) setGame(local);
      })
      .catch(() => {
        if (local) setGame(local);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  useEffect(() => {
    setCodeDraft(game?.refinement?.generatedCode ?? "");
  }, [game?.refinement?.generatedCode]);

  // Runtime errors from inside the sandboxed game.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const err = event.data?.__kultGameError;
      if (err?.message && !String(err.message).includes("ResizeObserver")) {
        setLastError({ message: String(err.message).slice(0, 300), stack: String(err.stack ?? "").slice(0, 600) });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const colors: string[] = useMemo(
    () => (Array.isArray(game?.visuals?.colors) ? game.visuals.colors.slice(0, 3) : ["#35e8ff", "#ff3df2", "#ffd166"]),
    [game],
  );
  const tuning: Record<string, unknown> = game?.gameplay?.tuning ?? {};
  const numericTuning = Object.entries(tuning).filter(([, v]) => typeof v === "number") as [string, number][];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patchGame = useCallback((patch: (g: any) => any) => {
    setGame((prev: any) => (prev ? patch(structuredClone(prev)) : prev));
    setDirty(true);
    setLastError(null);
    setSaving("idle");
  }, []);

  const setColor = (index: number, value: string) =>
    patchGame((g) => {
      const next = Array.isArray(g.visuals?.colors) ? [...g.visuals.colors] : ["#35e8ff", "#ff3df2", "#ffd166"];
      next[index] = value;
      g.visuals = { ...(g.visuals ?? {}), colors: next };
      return g;
    });

  const setTuningValue = (key: string, value: number) =>
    patchGame((g) => {
      g.gameplay = { ...(g.gameplay ?? {}), tuning: { ...(g.gameplay?.tuning ?? {}), [key]: value } };
      return g;
    });

  const applyCodeDraft = () => {
    patchGame((g) => {
      g.refinement = { ...(g.refinement ?? {}), generatedCode: codeDraft, source: "manual-edit" };
      return g;
    });
    setReplayKey((k) => k + 1);
  };

  const save = async (publish = false) => {
    if (!game) return;
    setSaving("saving");
    try {
      const payload = publish
        ? { ...game, publish: { ...(game.publish ?? {}), published: true, publishedAt: new Date().toISOString() } }
        : game;
      await api.put(`/games/${encodeURIComponent(gameId)}`, { gamePackage: payload }, { timeout: 30000 });
      setGame(payload);
      addCreatedGame(payload);
      setDirty(false);
      setSaving("saved");
      void refreshCreatedGames();
    } catch {
      setSaving("idle");
      setMessages((m) => [...m, { role: "assistant", text: "Could not save — is the backend running?" }]);
    }
  };

  const sendWish = async (text: string) => {
    const request = text.trim();
    if (!request || building || !game?.refinement?.generatedCode) return;
    setWish("");
    setBuilding(true);
    setLastError(null);
    const token = ++buildToken.current;
    setMessages((m) => [...m, { role: "user", text: request }]);

    try {
      const refinement = await runCodeJob(
        {
          gamePackage: game,
          request,
          baseCode: game.refinement.generatedCode,
          refinementLevel: "medium",
        },
        8 * 60 * 1000,
        (status) => setBuildStatus(status),
        () => buildToken.current !== token,
      );
      if (buildToken.current !== token) return;
      if (refinement?.generatedCode) {
        patchGame((g) => {
          g.refinement = refinement;
          return g;
        });
        setReplayKey((k) => k + 1);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text:
              refinement.source === "seed-fallback"
                ? "I couldn't apply that change cleanly, so I kept your previous working build. Try describing it differently."
                : "Done — the change is live in the preview. Hit Save Changes to keep it. ✨",
          },
        ]);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: "The build came back empty — please try again." }]);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown error";
      setMessages((m) => [...m, { role: "assistant", text: `That change failed (${message}). Try again or rephrase.` }]);
    } finally {
      if (buildToken.current === token) {
        setBuilding(false);
        setBuildStatus("");
      }
    }
  };

  const fixError = () => {
    if (!lastError) return;
    void sendWish(
      `Please fix this runtime error without changing the gameplay:\n\n${lastError.message}\n\nStack trace:\n${lastError.stack}`,
    );
  };

  if (!game) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin" /> Loading game…
        </div>
      </div>
    );
  }

  const hasBuild = Boolean(game.refinement?.generatedCode);

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-3">
        <input
          value={game.title ?? ""}
          onChange={(e) => patchGame((g) => ({ ...g, title: e.target.value }))}
          className="min-w-0 flex-1 bg-transparent font-display text-xl font-black outline-none focus:text-primary sm:max-w-md"
        />
        <span className="label-mono flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {saving === "saved" && !dirty ? (
            <>
              Changes saved <Check className="size-3.5 text-neon-green" />
            </>
          ) : dirty ? (
            "Unsaved changes"
          ) : (
            "Up to date"
          )}
        </span>
        <button
          onClick={() => navigate({ to: "/play/$gameId", params: { gameId } })}
          className="flex items-center gap-1.5 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
        >
          <Play className="size-3.5" /> Play
        </button>
        <button
          onClick={() => void save(true)}
          className="flex items-center gap-1.5 rounded-lg border border-primary/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary transition hover:bg-primary/10"
        >
          <Rocket className="size-3.5" /> Publish
        </button>
        <button
          onClick={() => void save(false)}
          disabled={!dirty || saving === "saving"}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving === "saving" ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save Changes
        </button>
      </header>

      <div className="grid flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[340px_minmax(0,1fr)_320px]">
        {/* Chat / wishes */}
        <section className="flex min-h-[320px] flex-col rounded-2xl border border-border/60 bg-card/60">
          <p className="label-mono flex items-center gap-2 border-b border-border/50 px-4 py-3 text-[10px] text-primary">
            <Wand2 className="size-4" /> Wish it — the agent edits your game
          </p>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    message.role === "user" ? "bg-secondary text-foreground" : "bg-background/60 text-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {building && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                {buildStatus || "Applying your change…"}
              </div>
            )}
          </div>
          {lastError && !building && (
            <button
              onClick={fixError}
              className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-3 py-2 text-left text-xs text-red-300 transition hover:bg-red-500/20"
            >
              <Bug className="size-4 shrink-0" />
              <span className="min-w-0 truncate">Game error: {lastError.message} — tap to fix</span>
            </button>
          )}
          <div className="flex gap-2 border-t border-border/50 p-3">
            <input
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendWish(wish);
              }}
              disabled={building || !hasBuild}
              placeholder={hasBuild ? "Tap to wish… e.g. make enemies faster" : "No build yet for this game"}
              className="min-w-0 flex-1 rounded-xl bg-secondary/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => void sendWish(wish)}
              disabled={building || !wish.trim()}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </div>
        </section>

        {/* Live preview */}
        <section className="flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-black/40">
          <div className="relative flex-1">
            <div className="absolute inset-0" key={replayKey}>
              <GamePreview gamePackage={game} />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-2.5">
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              className="flex items-center gap-1.5 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
            >
              <RotateCcw className="size-3.5" /> Replay
            </button>
            <span className="label-mono text-[10px] text-muted-foreground">
              {game.refinement?.source === "manual-edit" ? "manual edit" : game.refinement?.source ?? "build"} ·{" "}
              {game.refinement?.model ?? ""}
            </span>
          </div>
        </section>

        {/* Settings / code */}
        <section className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60">
          <div className="flex border-b border-border/50">
            {(["settings", "code"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                  tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "settings" ? "Game Settings" : "Code"}
              </button>
            ))}
          </div>

          {tab === "settings" ? (
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <div>
                <p className="mb-2 text-xs font-bold">Colors</p>
                <div className="space-y-2">
                  {["Primary", "Secondary", "Accent"].map((label, index) => (
                    <label key={label} className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      {label}
                      <input
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(colors[index] ?? "") ? colors[index] : "#35e8ff"}
                        onChange={(e) => setColor(index, e.target.value)}
                        className="h-8 w-24 cursor-pointer rounded border border-border/60 bg-transparent"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {numericTuning.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold">Gameplay tuning</p>
                  <div className="space-y-3">
                    {numericTuning.map(([key, value]) => (
                      <label key={key} className="block text-xs text-muted-foreground">
                        <span className="mb-1 flex items-center justify-between">
                          {key}
                          <span className="font-mono text-foreground">{value}</span>
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(10, value * 2)}
                          step={value >= 100 ? 10 : value >= 10 ? 1 : 0.5}
                          value={value}
                          onChange={(e) => setTuningValue(key, Number(e.target.value))}
                          className="w-full accent-[oklch(0.72_0.27_340)]"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <Sparkles className="mr-1 inline size-3 text-primary" />
                Settings apply to the preview instantly. For anything deeper — rules, enemies, levels — use the wish box.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden p-3">
              <textarea
                value={codeDraft}
                onChange={(e) => setCodeDraft(e.target.value)}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none rounded-lg bg-background/70 p-3 font-mono text-[11px] leading-relaxed text-foreground/90 outline-none"
              />
              <button
                onClick={applyCodeDraft}
                disabled={codeDraft === (game.refinement?.generatedCode ?? "")}
                className="mt-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
              >
                Apply code to preview
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
