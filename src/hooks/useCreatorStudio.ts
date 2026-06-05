import { useCallback, useEffect, useMemo, useState } from "react";
import { gameTemplates, themePresets } from "../lib/templates";
import { api } from "../lib/api";
import { engineOf } from "../lib/studio-meta";

const defaultPrompt = "cyberpunk doge samurai fighting AI robots in a neon arena";

function templateForPrompt(prompt) {
  const text = prompt.toLowerCase();
  const match = (ids, terms) => terms.some(term => text.includes(term))
    ? gameTemplates.find(template => ids.includes(template.id))
    : null;

  return (
    match(["head-soccer-2026"], ["soccer", "football", "world cup", "sports"]) ||
    match(["goof-runner"], ["endless runner", "runner", "run", "jump", "parkour"]) ||
    match(["mini-racer"], ["racing", "racer", "race", "car", "cars", "driving", "traffic"]) ||
    match(["bubble-shooter"], ["bubble", "shooter", "aim"]) ||
    match(["blocks-match3"], ["match 3", "match-3", "match three", "blocks", "jewel", "candy"]) ||
    gameTemplates.find(template => text.includes(template.category.toLowerCase())) ||
    gameTemplates.find(template => text.includes(template.name.toLowerCase())) ||
    null
  );
}

export function localPackage(template, options) {
  const theme = themePresets[options.theme] ?? themePresets.neon;
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
      extra: options.extra
    },
    gameplay: {
      mechanic: template.mechanic,
      controls: template.controls,
      tuning
    },
    visuals: {
      mood: theme.mood,
      colors: theme.colors,
      assets: template.assets
    },
    build: {
      renderer: template.engine === "construct" ? "Embedded HTML5 Construct runtime" : template.engine === "unity" ? "Unity WebGL runtime" : "Playable Canvas runtime",
      runtimeTarget: "Browser",
      externalAssets: template.engine === "construct",
      publishReady: true
    },
    checklist: [
      "Deterministic template selected",
      "Difficulty tuning applied",
      "Theme colors injected",
      "Canvas-safe asset plan generated",
      "Optional AI refinement available"
    ]
  };
}

function localTemplateExport() {
  return {
    name: "kult-template-pack",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    strategy: {
      tier1: "Templates are primary: instant, deterministic, zero API cost.",
      tier2: "LLM refinement is optional and prompt-driven."
    },
    themes: themePresets,
    templates: gameTemplates.map(template => ({
      ...template,
      assets: [
        {
          id: `${template.id}-procedural-assets`,
          type: "procedural",
          format: "canvas",
          description: template.assets
        }
      ],
      aiRefinement: {
        system: "You are an expert Phaser 3 game developer. Output only executable JavaScript. Use Canvas-drawn assets. No markdown.",
        userTemplate: `Game: ${template.name}\nMechanic: ${template.mechanic}\nControls: ${template.controls}`
      }
    })),
    usage: {
      exportNote: "Assets are procedural Canvas manifests. The game runtime draws them instead of shipping image files."
    }
  };
}

export function useCreatorStudio() {
  const [engine, setEngine] = useState("threejs");
  const [selectedId, setSelectedId] = useState("flappy");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [theme, setTheme] = useState("neon");
  const [difficulty, setDifficulty] = useState("normal");
  const [customization, setCustomization] = useState("light");
  const [extra, setExtra] = useState("none");
  const [status, setStatus] = useState("Ready");
  const [packageMode, setPackageMode] = useState("Tier 1");
  const [agentStack, setAgentStack] = useState(null);
  const [agentStatus, setAgentStatus] = useState("Agents idle");
  const [orchestrationPlan, setOrchestrationPlan] = useState(null);
  const [assetResult, setAssetResult] = useState(null);
  const [generatedPackage, setGeneratedPackage] = useState(() =>
    localPackage(gameTemplates[0], { prompt: defaultPrompt, theme: "neon", difficulty: "normal", customization: "light", extra: "none" })
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
              speech: "openai/whisper-large-v3"
            }
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
    () => gameTemplates.map(t => ({ ...t, engine: t.engine ?? "threejs" })).filter(t => t.engine === engine),
    [engine]
  );

  useEffect(() => {
    if (filteredTemplates.length > 0 && !filteredTemplates.some(t => t.id === selectedId)) {
      setSelectedId(filteredTemplates[0].id);
    }
  }, [engine, filteredTemplates, selectedId]);

  const selectedTemplate = useMemo(
    () => filteredTemplates.find(template => template.id === selectedId) ?? filteredTemplates[0] ?? gameTemplates[0],
    [selectedId, filteredTemplates]
  );

  const options = useMemo(
    () => ({ prompt, theme, difficulty, customization, extra }),
    [prompt, theme, difficulty, customization, extra]
  );

  const createFromTemplate = useCallback(async () => {
    setStatus("Creating");
    setPackageMode("Tier 1");
    try {
      const response = await api.post("/games/create", {
        templateId: selectedTemplate.id,
        ...options
      });
      setGeneratedPackage(response.data.game);
      setStatus("Generated");
    } catch {
      setGeneratedPackage(localPackage(selectedTemplate, options));
      setStatus("Generated locally");
    }
  }, [options, selectedTemplate]);

  const generateFromPrompt = useCallback(async (strategy = "hybrid", promptOverride = "") => {
    const effectivePrompt = promptOverride || prompt;
    const effectiveOptions = { ...options, prompt: effectivePrompt };
    setStatus("Generating from prompt");
    setPackageMode(strategy === "pure-agent" ? "Pure Agent" : "Prompt");
    setAgentStatus(`Running ${strategy === "pure-agent" ? "pure agent" : "hybrid"} pipeline`);
    const promptTemplate = templateForPrompt(effectivePrompt) ?? selectedTemplate;

    if (strategy === "hybrid") {
      setEngine(engineOf(promptTemplate));
      setSelectedId(promptTemplate.id);
      const game = localPackage(promptTemplate, effectiveOptions);
      setGeneratedPackage(game);
      setPackageMode("Template");
      setAgentStatus(`Template matched: ${promptTemplate.name}`);
      setStatus("Generated from template");
      return game;
    }

    try {
      const response = await api.post("/games/generate-from-prompt", {
        prompt: effectivePrompt,
        templateId: promptTemplate.id,
        theme,
        difficulty,
        customization,
        extra,
        includePlan: true,
        includeCode: true,
        includeAssets: false,
        strategy
      }, { timeout: 180000 });

      const result = response.data;
      setGeneratedPackage(result.game);
      if (result.game?.templateId) {
        const template = gameTemplates.find(t => t.id === result.game.templateId);
        if (template) setEngine(engineOf(template));
        setSelectedId(result.game.templateId);
      }
      if (result.plan) setOrchestrationPlan(result.plan);
      if (result.assets) setAssetResult(result.assets);
      setPackageMode(result.game?.tier === "prompt-agent" ? "Prompt + Agents" : "Prompt");
      setAgentStatus(result.warnings?.length ? result.warnings.join(" ") : "Prompt pipeline complete");
      setStatus(result.refinement?.generatedCode ? "Game generated with code" : "Game generated");
      return result.game;
    } catch (error) {
      setEngine(engineOf(promptTemplate));
      setSelectedId(promptTemplate.id);
      const game = localPackage(promptTemplate, effectiveOptions);
      setGeneratedPackage(game);
      setAgentStatus(error.response?.data?.error ?? "Prompt pipeline unavailable");
      setStatus("Generated locally");
      return game;
    }
  }, [customization, difficulty, extra, options, prompt, selectedTemplate, theme]);

  const refineWithAi = useCallback(async () => {
    setStatus("Preparing AI");
    setPackageMode("Tier 2");
    try {
      const response = await api.post("/agents/code", {
        gamePackage: generatedPackage,
        request: prompt,
        refinementLevel: customization
      }, { timeout: 120000 });
      const refinement = response.data.refinement;
      setGeneratedPackage(prev => ({
        ...prev,
        tier: "ai-refinement",
        refinement
      }));
      setAgentStatus(`Code agent: ${refinement?.model ?? "deepseek-v4-pro"}`);
      setStatus(refinement?.generatedCode ? "AI code generated" : "AI prompt ready");
    } catch (error) {
      setGeneratedPackage(prev => ({
        ...prev,
        tier: "ai-refinement",
        refinement: {
          error: error.response?.data?.error ?? "AI refinement failed",
          promptBundle: {
            system: "Tier 2 could not reach the configured 0G agent.",
            user: `Refine ${prev.title}. User request: ${prompt}`
          }
        }
      }));
      setAgentStatus("Code agent unavailable");
      setStatus("AI setup needed");
    }
  }, [customization, generatedPackage, prompt]);

  const orchestrateBuild = useCallback(async () => {
    setAgentStatus("Planning with orchestrator");
    try {
      const response = await api.post("/agents/orchestrate", {
        prompt,
        context: {
          template: selectedTemplate,
          options,
          gamePackage: generatedPackage
        }
      }, { timeout: 60000 });
      setOrchestrationPlan(response.data.result);
      setAgentStatus(`Orchestrator: ${response.data.result?.model ?? "glm-5.1"}`);
    } catch (error) {
      setOrchestrationPlan({
        error: error.response?.data?.error ?? "Orchestrator unavailable",
        content: "Use the selected template and local deterministic package."
      });
      setAgentStatus("Orchestrator unavailable");
    }
  }, [generatedPackage, options, prompt, selectedTemplate]);

  const generateAssets = useCallback(async () => {
    setAgentStatus("Generating image assets");
    try {
      const response = await api.post("/agents/assets", {
        prompt: [
          `${generatedPackage.title} game thumbnail`,
          generatedPackage.gameplay?.mechanic,
          generatedPackage.visuals?.mood,
          "polished colorful game cover art, no text"
        ].filter(Boolean).join(", ")
      }, { timeout: 60000 });
      setAssetResult(response.data.result);
      setAgentStatus(`Image agent: ${response.data.result?.model ?? "z-image"}`);
    } catch (error) {
      setAssetResult({
        error: error.response?.data?.error ?? "Asset generation unavailable"
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
    getTemplateExport
  };
}
