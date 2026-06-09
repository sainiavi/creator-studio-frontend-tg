import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCreatorStudio } from "@/hooks/useCreatorStudio";
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

  const {
    createFromTemplate,
    customization,
    difficulty,
    extra,
    selectedId,
    theme,
  } = studio;

  // Keep the generated package in sync whenever the selection or options change.
  useEffect(() => {
    createFromTemplate();
  }, [createFromTemplate, customization, difficulty, extra, selectedId, theme]);

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
