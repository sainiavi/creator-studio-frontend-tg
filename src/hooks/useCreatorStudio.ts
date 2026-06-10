import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gameTemplates, themePresets } from "../lib/templates";
import { api } from "../lib/api";
import { engineOf } from "../lib/studio-meta";

const defaultPrompt = "cyberpunk doge samurai fighting AI robots in a neon arena";

function getAnonymousUserId(): string {
  const key = "kult_anon_uid";
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, uid);
  }
  return uid;
}

function templateForPrompt(prompt: string) {
  const text = prompt.toLowerCase();
  const match = (ids: string[], terms: string[]) =>
    terms.some((term: string) => text.includes(term))
      ? gameTemplates.find((template: any) => ids.includes(template.id))
      : null;

  return (
    match(["chess"], ["chess", "checkmate", "chessboard", "grandmaster"]) ||
    match(["head-soccer-2026"], ["soccer", "football", "world cup", "sports"]) ||
    match(["goof-runner"], ["endless runner", "runner", "run", "jump", "parkour"]) ||
    match(["mini-racer"], ["racing", "racer", "race", "car", "cars", "driving", "traffic"]) ||
    match(["bubble-shooter"], ["bubble", "shooter", "aim"]) ||
    match(["blocks-match3"], ["match 3", "match-3", "match three", "blocks", "jewel", "candy"]) ||
    gameTemplates.find((template) => text.includes(template.category.toLowerCase())) ||
    gameTemplates.find((template) => text.includes(template.name.toLowerCase())) ||
    null
  );
}

function recentCreationContext() {
  try {
    const games = JSON.parse(localStorage.getItem("kult-created-games") ?? "[]");
    return games.slice(0, 12).map((game: any) => ({
      id: game.id,
      title: game.title,
      templateId: game.templateId,
      category: game.category,
      thumbnailUrl: game.thumbnailUrl,
      createdAt: game.createdAt,
    }));
  } catch {
    return [];
  }
}

export function localPackage(template: any, options: any) {
  const theme = themePresets[options.theme as keyof typeof themePresets] ?? themePresets.neon;
  const tuning = template.difficulty[options.difficulty] ?? template.difficulty.normal;
  const slug = `${template.id}-${options.theme}-${Date.now().toString(36)}`;

  return {
    id: slug,
    tier: "template",
    title: `${theme.label} ${template.name}`,
    templateId: template.id,
    templateName: template.name,
    category: template.category,
    createdIn: template.time,
    apiCost: 0,
    reliability: template.reliability,
    customization: {
      prompt: options.prompt,
      theme: theme.label,
      level: options.customization,
      difficulty: options.difficulty,
      extra: options.extra,
    },
    gameplay: {
      mechanic: template.mechanic,
      controls: template.controls,
      tuning,
    },
    visuals: {
      mood: theme.mood,
      colors: theme.colors,
      assets: template.assets,
    },
    build: {
      renderer:
        template.engine === "construct"
          ? "Embedded HTML5 Construct runtime"
          : template.engine === "unity"
            ? "Unity WebGL runtime"
            : "Playable Canvas runtime",
      runtimeTarget: "Browser",
      externalAssets: template.engine === "construct",
      publishReady: true,
    },
    checklist: [
      "Deterministic template selected",
      "Difficulty tuning applied",
      "Theme colors injected",
      "Canvas-safe asset plan generated",
      "Optional AI refinement available",
    ],
  };
}

function localTemplateExport() {
  return {
    name: "kult-template-pack",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    strategy: {
      tier1: "Templates are primary: instant, deterministic, zero API cost.",
      tier2: "LLM refinement is optional and prompt-driven.",
    },
    themes: themePresets,
    templates: gameTemplates.map((template) => ({
      ...template,
      assets: [
        {
          id: `${template.id}-procedural-assets`,
          type: "procedural",
          format: "canvas",
          description: template.assets,
        },
      ],
      aiRefinement: {
        system:
          "You are an expert Phaser 3 game developer. Output only executable JavaScript. Use Canvas-drawn assets. No markdown.",
        userTemplate: `Game: ${template.name}\nMechanic: ${template.mechanic}\nControls: ${template.controls}`,
      },
    })),
    usage: {
      exportNote:
        "Assets are procedural Canvas manifests. The game runtime draws them instead of shipping image files.",
    },
  };
}

export function useCreatorStudio() {
  const generationRef = useRef(0);
  const [engine, setEngine] = useState("threejs");
  const [selectedId, setSelectedId] = useState("flappy");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [theme, setTheme] = useState("neon");
  const [difficulty, setDifficulty] = useState("normal");
  const [customization, setCustomization] = useState("light");
  const [extra, setExtra] = useState("none");
  const [status, setStatus] = useState("Ready");
  const [packageMode, setPackageMode] = useState("Tier 1");
  const [agentStack, setAgentStack] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState("Agents idle");
  const [orchestrationPlan, setOrchestrationPlan] = useState<any>(null);
  const [assetResult, setAssetResult] = useState<any>(null);
  const [generatedPackage, setGeneratedPackage] = useState(() =>
    localPackage(gameTemplates[0], {
      prompt: defaultPrompt,
      theme: "neon",
      difficulty: "normal",
      customization: "light",
      extra: "none",
    }),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAgentStack() {
      try {
        const response = await api.get("/agents/stack");
        if (!cancelled) setAgentStack(response.data);
      } catch {
        if (!cancelled) {
          setAgentStack({
            provider: "0g",
            hasApiKey: false,
            models: {
              orchestrator: "glm-5.1",
              coding: "deepseek-v4-pro",
              background: "deepseek-v4-flash",
              image: "z-image",
              vision: "qwen/qwen3-vl-30b-a3b-instruct",
              speech: "openai/whisper-large-v3",
            },
          });
        }
      }
    }

    loadAgentStack();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTemplates = useMemo(
    () =>
      gameTemplates
        .map((t) => ({ ...t, engine: t.engine ?? "threejs" }))
        .filter((t) => t.engine === engine),
    [engine],
  );

  useEffect(() => {
    if (filteredTemplates.length > 0 && !filteredTemplates.some((t) => t.id === selectedId)) {
      setSelectedId(filteredTemplates[0].id);
    }
  }, [engine, filteredTemplates, selectedId]);

  const selectedTemplate = useMemo(
    () =>
      filteredTemplates.find((template) => template.id === selectedId) ??
      filteredTemplates[0] ??
      gameTemplates[0],
    [selectedId, filteredTemplates],
  );

  const options = useMemo(
    () => ({ prompt, theme, difficulty, customization, extra }),
    [prompt, theme, difficulty, customization, extra],
  );

  const createFromTemplate = useCallback(async () => {
    setStatus("Creating");
    setPackageMode("Tier 1");
    try {
      const response = await api.post("/games/create", {
        templateId: selectedTemplate.id,
        userId: getAnonymousUserId(),
        ...options,
      });
      setGeneratedPackage(response.data.game);
      setStatus("Generated");
    } catch {
      setGeneratedPackage(localPackage(selectedTemplate, options));
      setStatus("Generated locally");
    }
  }, [options, selectedTemplate]);

  const generateFromPrompt = useCallback(
    async (strategy = "hybrid", promptOverride = "") => {
      const effectivePrompt = promptOverride || prompt;
      const effectiveOptions = { ...options, prompt: effectivePrompt };
      const token = ++generationRef.current;
      setStatus("Generating from prompt");
      setPackageMode(strategy === "pure-agent" ? "Pure Agent" : "Prompt");
      setAgentStatus(`Routing ${strategy === "pure-agent" ? "pure agent" : "hybrid"} request…`);
      setOrchestrationPlan(null);
      setAssetResult(null);
      // A confident keyword match (e.g. "chess", "racing") — null for vague prompts.
      const localMatch = templateForPrompt(effectivePrompt);
      const promptTemplate = localMatch ?? selectedTemplate;
      // Lock the matched template for hybrid so the routing agent can't drift to a different
      // game. Pure-agent always goes to the backend (it designs from scratch, no template).
      const lockTemplate = strategy !== "pure-agent" && Boolean(localMatch);

      // Phase 0 (instant): show a playable local build immediately so the preview is never blank.
      setEngine(engineOf(promptTemplate));
      setSelectedId(promptTemplate.id);
      const localGame = localPackage(promptTemplate, effectiveOptions);
      setGeneratedPackage(localGame);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let baseGame: any = localGame;

      if (lockTemplate) {
        // Clear intent — keep the matched template, skip the ~23s routing call entirely.
        setPackageMode("Prompt");
        setStatus("Playable template ready");
        setAgentStatus(`Matched “${promptTemplate.name}” — generating AI build in the background…`);
      } else {
        // Phase 1 (fast): vague prompt — let the backend routing agent pick the closest template.
        // No code/assets/plan, so it returns well under the ~100s gateway timeout.
        try {
          const response = await api.post(
            "/games/generate-from-prompt",
            {
              prompt: effectivePrompt,
              userId: getAnonymousUserId(),
              context: {
                preferredTemplateId: promptTemplate.id,
                recentCreations: recentCreationContext(),
                requestedStrategy: strategy,
              },
              theme,
              difficulty,
              customization,
              extra,
              includePlan: false,
              includeCode: false,
              includeAssets: false,
              strategy,
            },
            { timeout: 90000 },
          );
          const result = response.data;
          baseGame = {
            ...result.game,
            thumbnailUrl: result.game?.thumbnailUrl ?? "/thumbnails/simple-agent-game-cover.png",
          };
          if (baseGame?.templateId) {
            const template = gameTemplates.find((t) => t.id === baseGame.templateId);
            if (template) setEngine(engineOf(template));
            setSelectedId(baseGame.templateId);
          }
          setGeneratedPackage(baseGame);
          setPackageMode("Prompt");
          setStatus("Playable template ready");
          setAgentStatus("Template ready — generating AI build in the background…");
        } catch (error: any) {
          // Routing failed (offline/timeout) — keep the instant local build, still playable.
          baseGame = localGame;
          setStatus("Generated locally");
          setAgentStatus(
            error.response?.data?.error ?? "Prompt pipeline unreachable — showing local template",
          );
        }
      }

      // Phase 2 (background): ask the coding agent (seed-and-edit) for the real build and swap
      // it in when ready. If it is slow or fails, the playable template stays in place.
      void (async () => {
        try {
          const codeResponse = await api.post(
            "/agents/code",
            {
              gamePackage: baseGame,
              request: effectivePrompt,
              refinementLevel: customization,
            },
            { timeout: 150000 },
          );
          if (generationRef.current !== token) return; // superseded by a newer generation
          const refinement = codeResponse.data?.refinement;
          if (refinement?.generatedCode) {
            setGeneratedPackage((prev) => ({
              ...(prev ?? baseGame),
              tier: "ai-refinement",
              refinement,
            }));
            setPackageMode("Prompt + Agents");
            setStatus("Game generated with code");
            setAgentStatus(`AI build ready · ${refinement.source ?? refinement.model ?? "agent"}`);
          } else {
            setAgentStatus("AI build returned no code — showing playable template");
          }
        } catch (error: any) {
          if (generationRef.current !== token) return;
          setAgentStatus(
            error.response?.data?.error
              ? `AI build failed: ${error.response.data.error} — showing playable template`
              : "AI build timed out — showing playable template",
          );
        }
      })();

      return baseGame;
    },
    [customization, difficulty, extra, options, prompt, selectedTemplate, theme],
  );

  const refineWithAi = useCallback(async () => {
    setStatus("Preparing AI");
    setPackageMode("Tier 2");
    try {
      const response = await api.post(
        "/agents/code",
        {
          gamePackage: generatedPackage,
          request: prompt,
          refinementLevel: customization,
        },
        { timeout: 120000 },
      );
      const refinement = response.data.refinement;
      setGeneratedPackage((prev) => ({
        ...prev,
        tier: "ai-refinement",
        refinement,
      }));
      setAgentStatus(`Code agent: ${refinement?.model ?? "deepseek-v4-pro"}`);
      setStatus(refinement?.generatedCode ? "AI code generated" : "AI prompt ready");
    } catch (error: any) {
      setGeneratedPackage((prev) => ({
        ...prev,
        tier: "ai-refinement",
        refinement: {
          error: error.response?.data?.error ?? "AI refinement failed",
          promptBundle: {
            system: "Tier 2 could not reach the configured 0G agent.",
            user: `Refine ${prev.title}. User request: ${prompt}`,
          },
        },
      }));
      setAgentStatus("Code agent unavailable");
      setStatus("AI setup needed");
    }
  }, [customization, generatedPackage, prompt]);

  const orchestrateBuild = useCallback(async () => {
    setAgentStatus("Planning with orchestrator");
    try {
      const response = await api.post(
        "/agents/orchestrate",
        {
          prompt,
          context: {
            template: selectedTemplate,
            options,
            gamePackage: generatedPackage,
          },
        },
        { timeout: 60000 },
      );
      setOrchestrationPlan(response.data.result);
      setAgentStatus(`Orchestrator: ${response.data.result?.model ?? "glm-5.1"}`);
    } catch (error: any) {
      setOrchestrationPlan({
        error: error.response?.data?.error ?? "Orchestrator unavailable",
        content: "Use the selected template and local deterministic package.",
      });
      setAgentStatus("Orchestrator unavailable");
    }
  }, [generatedPackage, options, prompt, selectedTemplate]);

  const generateAssets = useCallback(async () => {
    setAgentStatus("Generating image assets");
    try {
      const response = await api.post(
        "/agents/assets",
        {
          prompt: [
            `${generatedPackage.title} game thumbnail`,
            generatedPackage.gameplay?.mechanic,
            generatedPackage.visuals?.mood,
            "polished colorful game cover art, no text",
          ]
            .filter(Boolean)
            .join(", "),
        },
        { timeout: 60000 },
      );
      setAssetResult(response.data.result);
      setAgentStatus(`Image agent: ${response.data.result?.model ?? "z-image"}`);
    } catch (error: any) {
      setAssetResult({
        error: error.response?.data?.error ?? "Asset generation unavailable",
      });
      setAgentStatus("Image agent unavailable");
    }
  }, [generatedPackage]);

  const getTemplateExport = useCallback(async () => {
    try {
      const response = await api.get("/templates/export");
      return response.data;
    } catch {
      return localTemplateExport();
    }
  }, []);

  return {
    templates: filteredTemplates,
    engine,
    setEngine,
    themePresets,
    selectedTemplate,
    selectedId,
    setSelectedId,
    prompt,
    setPrompt,
    theme,
    setTheme,
    difficulty,
    setDifficulty,
    customization,
    setCustomization,
    extra,
    setExtra,
    status,
    agentStack,
    agentStatus,
    orchestrationPlan,
    assetResult,
    packageMode,
    generatedPackage,
    createFromTemplate,
    generateFromPrompt,
    refineWithAi,
    orchestrateBuild,
    generateAssets,
    getTemplateExport,
  };
}
