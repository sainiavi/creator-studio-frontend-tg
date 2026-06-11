import { GeneratedGameFrame } from "./GeneratedGameFrame";
import { ThreePreview } from "./ThreePreview";

type AnyPackage = Record<string, unknown> & {
  title?: string;
  templateId?: string;
  refinement?: { generatedCode?: string };
};

/**
 * Chooses how to play a generated package:
 *  - Tier 2: if the 0G agent produced runnable code, run it in the sandbox iframe.
 *  - Tier 1: otherwise fall back to the deterministic built-in maker (instant, reliable).
 *  - Pure-agent packages have no template behind them, so until their code is
 *    ready there is nothing meaningful to play — show the build status instead
 *    of the maker's default (flappy) demo, which looks like the wrong game.
 */
export function GamePreview({
  gamePackage,
  onScoreSubmit,
}: {
  gamePackage: AnyPackage;
  onScoreSubmit?: (score: number) => void;
}) {
  const generatedCode = gamePackage?.refinement?.generatedCode;
  if (typeof generatedCode === "string" && generatedCode.trim().length > 0) {
    return <GeneratedGameFrame gamePackage={gamePackage} onScoreSubmit={onScoreSubmit} />;
  }
  if (gamePackage?.templateId === "pure-agent") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#070a12] px-8 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="font-display text-lg font-bold text-white">
          {String(gamePackage?.title ?? "Your game")} is being built
        </p>
        <p className="max-w-sm text-sm text-white/60">
          The AI agent is writing this game from scratch — it usually takes 10-15 minutes.
          It will appear here automatically when ready.
        </p>
      </div>
    );
  }
  return <ThreePreview gamePackage={gamePackage} onScoreSubmit={onScoreSubmit} />;
}
