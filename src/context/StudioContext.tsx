import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCreatorStudio } from "@/hooks/useCreatorStudio";
import { useWallet } from "@/hooks/useWallet";
import { engineOf } from "@/lib/studio-meta";
import { gameTemplates } from "@/lib/templates";

type Studio = ReturnType<typeof useCreatorStudio>;
type Wallet = ReturnType<typeof useWallet>;

type StudioContextValue = {
  studio: Studio;
  wallet: Wallet;
  /** Select a template (switching engine if needed) and jump to the Studio route. */
  openInStudio: (templateId: string) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const studio = useCreatorStudio();
  const wallet = useWallet();
  const navigate = useNavigate();

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
    <StudioContext.Provider value={{ studio, wallet, openInStudio }}>
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
