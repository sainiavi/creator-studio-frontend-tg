import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { useCreatorStudio } from "@/hooks/useCreatorStudio";
import { api } from "@/lib/api";
import { engineOf } from "@/lib/studio-meta";
import { findGameTemplate } from "@/lib/templates-loader";
import { ownsGame } from "@/lib/identity";

type Studio = ReturnType<typeof useCreatorStudio>;

type StudioContextValue = {
  studio: Studio;
  createdGames: any[];
  addCreatedGame: (game: any) => void;
  removeCreatedGame: (gameId: string) => Promise<void>;
  /** Re-fetches backend games and merges them in (e.g. while waiting for a build). */
  refreshCreatedGames: () => Promise<void>;
  /** Select a template (switching engine if needed) and jump to the Create route. */
  openInStudio: (templateId: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

// localStorage holds lean metadata only: generated code is 20-30KB per game
// and would blow the ~5MB quota within a few dozen creations. Full packages
// (with code) live in memory and in the backend.
const LEGACY_CREATED_GAMES_KEY = "kult-created-games";
const createdGamesKey = (privyUserId: string) => `kult-created-games:${privyUserId}`;

function persistCreatedGames(privyUserId: string, games: any[]) {
  if (!privyUserId) return;
  try {
    const lean = games.slice(0, 60).map((g: any) => {
      const { refinement, plan, promptBundle, ...rest } = g ?? {};
      void plan;
      void promptBundle;
      return { ...rest, hasBuild: Boolean(refinement?.generatedCode) };
    });
    localStorage.setItem(createdGamesKey(privyUserId), JSON.stringify(lean));
  } catch {
    // quota exceeded — keep the in-memory state, drop persistence silently
  }
}

// Dead draft: a pure-agent game whose build never delivered code. A real
// build resolves within ~16 minutes; anything older without code is junk
// from an interrupted build and must never show in My Creations.
const DEAD_DRAFT_MS = 20 * 60 * 1000;
function isDeadDraft(game: any) {
  if (game?.templateId !== "pure-agent") return false;
  if (game?.refinement?.generatedCode || game?.hasBuild) return false;
  const born = Date.parse(String(game?.createdAt ?? "")) || 0;
  return born > 0 && Date.now() - born > DEAD_DRAFT_MS;
}

function isPlayableCreation(game: any) {
  if (["building", "failed", "cancelled"].includes(String(game?.buildStatus ?? ""))) return false;
  if (game?.templateId === "pure-agent" && !game?.refinement?.generatedCode && !game?.hasBuild) {
    return false;
  }
  return !isDeadDraft(game);
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const studio = useCreatorStudio();
  const navigate = useNavigate();
  const { ready: authReady, authenticated, user } = usePrivy();
  const privyUserId = authReady && authenticated ? (user?.id ?? "") : "";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [createdGames, setCreatedGames] = useState<any[]>([]);

  const loadCachedGames = useCallback((userId: string) => {
    if (!userId) return [];
    try {
      const key = createdGamesKey(userId);
      let stored = localStorage.getItem(key);

      // One-time migration from the old cache shared by every account. Only
      // records verified as belonging to this identity are retained.
      if (!stored) {
        const legacy = localStorage.getItem(LEGACY_CREATED_GAMES_KEY);
        const legacyGames: any[] = legacy ? JSON.parse(legacy) : [];
        const ownedLegacyGames = legacyGames.filter((g) => ownsGame(g?.creatorId));
        if (ownedLegacyGames.length) {
          persistCreatedGames(userId, ownedLegacyGames);
          stored = localStorage.getItem(key);
        }
        localStorage.removeItem(LEGACY_CREATED_GAMES_KEY);
      }

      const parsed: any[] = stored ? JSON.parse(stored) : [];
      return parsed
        .filter((g) => ownsGame(g?.creatorId))
        .filter(isPlayableCreation)
        .filter((g, i, all) => !g?.id || all.findIndex((x) => x?.id === g.id) === i);
    } catch {
      return [];
    }
  }, []);

  // Switching Privy accounts must immediately switch the in-memory game list.
  useEffect(() => {
    setCreatedGames(loadCachedGames(privyUserId));
  }, [loadCachedGames, privyUserId]);

  const addCreatedGame = (game: any) => {
    if (!isPlayableCreation(game)) return;
    setCreatedGames((prev) => {
      const updated = [game, ...prev.filter((g: any) => g?.id !== game?.id)];
      persistCreatedGames(privyUserId, updated);
      return updated;
    });
  };

  const removeCreatedGame = useCallback(async (gameId: string) => {
    await api.delete(`/games/${encodeURIComponent(gameId)}`).catch(() => {});
    setCreatedGames((prev) => {
      const updated = prev.filter((g: any) => g?.id !== gameId);
      persistCreatedGames(privyUserId, updated);
      return updated;
    });
  }, [privyUserId]);

  // A failed pure-agent build leaves a dead draft behind — no code and no
  // template to play. Delete it right away so it never lands in My Creations.
  const failedBuild = studio.activeBuild?.phase === "failed" ? studio.activeBuild : null;
  useEffect(() => {
    if (failedBuild?.strategy === "pure-agent" && failedBuild.game?.id) {
      void removeCreatedGame(failedBuild.game.id);
    }
  }, [failedBuild?.strategy, failedBuild?.game?.id, removeCreatedGame]);

  // localStorage only knows about games generated in this browser. Merge in
  // everything the backend persisted so creations show up on any client.
  // When both sides have the same game, prefer the copy that carries the
  // generated build (the backend saves it when the code job completes).
  const refreshCreatedGames = useCallback(async () => {
    if (!privyUserId) {
      setCreatedGames([]);
      return;
    }
    try {
      // Only the current user's creations belong in My Creations.
      const response = await api.get("/games/list", {
        timeout: 15000,
        params: { creatorId: privyUserId, limit: 100 },
      });
      const remote: any[] = response.data?.games ?? [];
      setCreatedGames((prev) => {
        const remoteById = new Map(remote.filter((g: any) => g?.id).map((g: any) => [g.id, g]));
        // The backend list is authoritative. A cached game absent from this
        // authenticated creator's response belongs to another account or is stale.
        const kept = prev.filter(
          (g: any) => isPlayableCreation(g) && g?.id && remoteById.has(g.id),
        );
        const upgraded = kept.map((g: any) => {
          const r = remoteById.get(g?.id);
          if (!r) return g;
          if (r.refinement?.generatedCode && !g?.refinement?.generatedCode) {
            return r;
          }
          // The backend generates a real cover image in the background —
          // swap out the placeholder SVG when it has landed.
          const localIsPlaceholder =
            !g?.thumbnailUrl ||
            String(g.thumbnailUrl).startsWith("data:image/svg+xml") ||
            String(g.thumbnailUrl).startsWith("/api/"); // backend-served — upgrade to the CDN URL
          const remoteIsReal =
            r.thumbnailUrl && !String(r.thumbnailUrl).startsWith("data:image/svg+xml");
          if (localIsPlaceholder && remoteIsReal) {
            return { ...g, thumbnailUrl: r.thumbnailUrl };
          }
          return g;
        });
        const known = new Set(kept.map((g: any) => g?.id));
        const added = remote.filter(
          (g: any) => isPlayableCreation(g) && g?.id && !known.has(g.id),
        );
        const merged = [...upgraded, ...added];
        persistCreatedGames(privyUserId, merged);
        return merged;
      });
    } catch {
      // backend offline — local games still show
    }
  }, [privyUserId]);

  useEffect(() => {
    void refreshCreatedGames();
  }, [refreshCreatedGames]);

  const {
    createFromTemplate,
    customization,
    difficulty,
    extra,
    isTemplateSyncPaused,
    selectedId,
    theme,
    templatesReady,
  } = studio;

  // Keep the generated package in sync whenever the selection or options change.
  // Skipped while a prompt generation is updating the selection itself —
  // otherwise this would overwrite the AI-designed package with a template one.
  useEffect(() => {
    if (!templatesReady) return;
    if (isTemplateSyncPaused()) return;
    createFromTemplate();
  }, [createFromTemplate, customization, difficulty, extra, isTemplateSyncPaused, selectedId, templatesReady, theme]);

  // "Use Template" selects the template, tags it for the Create page, and lets
  // the user describe how the generated game should differ from the base.
  const openInStudio = (templateId: string) => {
    void findGameTemplate(templateId).then((template) => {
      if (template) studio.setEngine(engineOf(template));
      studio.setSelectedId(templateId);
      sessionStorage.setItem("kult-create-template-id", templateId);
      navigate({ to: "/create" });
    });
  };

  return (
    <StudioContext.Provider
      value={{
        studio,
        createdGames,
        addCreatedGame,
        removeCreatedGame,
        refreshCreatedGames,
        openInStudio,
        sidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
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
