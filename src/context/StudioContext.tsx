import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCreatorStudio } from "@/hooks/useCreatorStudio";
import { api } from "@/lib/api";
import { engineOf } from "@/lib/studio-meta";
import { gameTemplates } from "@/lib/templates";

type Studio = ReturnType<typeof useCreatorStudio>;

type StudioContextValue = {
  studio: Studio;
  createdGames: any[];
  addCreatedGame: (game: any) => void;
  /** Select a template (switching engine if needed) and jump to the Studio route. */
  openInStudio: (templateId: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const studio = useCreatorStudio();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [createdGames, setCreatedGames] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("kult-created-games");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addCreatedGame = (game: any) => {
    setCreatedGames((prev) => {
      const updated = [game, ...prev];
      localStorage.setItem("kult-created-games", JSON.stringify(updated));
      return updated;
    });
  };

  // localStorage only knows about games generated in this browser. Merge in
  // everything the backend persisted so creations show up on any client.
  // When both sides have the same game, prefer the copy that carries the
  // generated build (the backend saves it when the code job completes).
  useEffect(() => {
    api
      .get("/games/list", { timeout: 15000 })
      .then((response) => {
        const remote: any[] = response.data?.games ?? [];
        if (!remote.length) return;
        setCreatedGames((prev) => {
          const remoteById = new Map(remote.filter((g: any) => g?.id).map((g: any) => [g.id, g]));
          let changed = false;
          const upgraded = prev.map((g: any) => {
            const r = remoteById.get(g?.id);
            if (r?.refinement?.generatedCode && !g?.refinement?.generatedCode) {
              changed = true;
              return r;
            }
            return g;
          });
          const known = new Set(prev.map((g: any) => g?.id));
          const added = remote.filter((g: any) => g?.id && !known.has(g.id));
          if (!changed && added.length === 0) return prev;
          return [...upgraded, ...added];
        });
      })
      .catch(() => {
        // backend offline — local games still show
      });
  }, []);

  const {
    createFromTemplate,
    customization,
    difficulty,
    extra,
    isTemplateSyncPaused,
    selectedId,
    theme,
  } = studio;

  // Keep the generated package in sync whenever the selection or options change.
  // Skipped while a prompt generation is updating the selection itself —
  // otherwise this would overwrite the AI-designed package with a template one.
  useEffect(() => {
    if (isTemplateSyncPaused()) return;
    createFromTemplate();
  }, [createFromTemplate, customization, difficulty, extra, isTemplateSyncPaused, selectedId, theme]);

  const openInStudio = (templateId: string) => {
    const template = gameTemplates.find((t: any) => t.id === templateId);
    if (template) studio.setEngine(engineOf(template));
    studio.setSelectedId(templateId);
    navigate({ to: "/studio" });
  };

  return (
    <StudioContext.Provider value={{ studio, createdGames, addCreatedGame, openInStudio, sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudioContext(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) {
    throw new Error("useStudioContext must be used within a StudioProvider");
  }
  return ctx;
}
