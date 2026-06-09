import { GeneratedGameFrame } from "./GeneratedGameFrame";
import { ThreePreview } from "./ThreePreview";

type AnyPackage = Record<string, unknown> & {
  refinement?: { generatedCode?: string };
};

/**
 * Chooses how to play a generated package:
 *  - Tier 2: if the 0G agent produced runnable code, run it in the sandbox iframe.
 *  - Tier 1: otherwise fall back to the deterministic built-in maker (instant, reliable).
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
    return <GeneratedGameFrame gamePackage={gamePackage} />;
  }
  return <ThreePreview gamePackage={gamePackage} onScoreSubmit={onScoreSubmit} />;
}
