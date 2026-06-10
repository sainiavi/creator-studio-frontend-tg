import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AnyPackage = Record<string, unknown> & {
  refinement?: { generatedCode?: string; source?: string; seededFrom?: string | null };
  templateName?: string;
};

// Strip the relative imports the agent module expects (gamePackage.js, styles.css,
// and any other "./..." import) so the code can run as a self-contained inline module.
// Exports must go too: the module body runs inside a try/catch, where `export`
// is a syntax error that blanks the entire game.
function prepareModule(code: string): string {
  return code
    .replace(/^\s*import\s+["'][^"']*\.css["'];?\s*$/gm, "")
    .replace(/^\s*import\s+[^;\n]*from\s+["']\.\.?\/[^"']*["'];?\s*$/gm, "")
    .replace(/^\s*import\s+["']\.\.?\/[^"']*["'];?\s*$/gm, "")
    .replace(/^\s*export\s+default\s+/gm, "")
    .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, "")
    .replace(/^(\s*)export\s+(const|let|var|function|class|async)/gm, "$1$2");
}

function buildSrcDoc(code: string, pkg: AnyPackage): string {
  // Don't ship the (large) refinement payload back into the sandbox.
  const { refinement, ...safe } = pkg;
  void refinement;
  const json = JSON.stringify(safe).replace(/</g, "\\u003c");
  const moduleBody = `const gamePackage = ${json};\n${prepareModule(code)}`.replace(
    /<\/script>/gi,
    "<\\/script>",
  );

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; height: 100%; background: #070a12; }
  body { display: flex; align-items: center; justify-content: center; overflow: hidden; }
  #game { width: 100%; height: auto; max-height: 100%; aspect-ratio: 16 / 9; display: block; touch-action: none; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
<canvas id="game"></canvas>
<script type="module">
try {
${moduleBody}
} catch (error) {
  const c = document.querySelector("#game");
  const ctx = c && c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#070a12"; ctx.fillRect(0, 0, c.width || 960, c.height || 540);
    ctx.fillStyle = "#ff6b81"; ctx.font = "16px system-ui, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Generated build failed to run: " + (error && error.message), (c.width || 960) / 2, (c.height || 540) / 2);
  }
  console.error("Generated game runtime error", error);
}
<\/script>
</body>
</html>`;
}

export function GeneratedGameFrame({ gamePackage }: { gamePackage: AnyPackage }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const code = gamePackage?.refinement?.generatedCode ?? "";
  const srcDoc = useMemo(() => buildSrcDoc(code, gamePackage), [code, gamePackage]);

  const source = gamePackage?.refinement?.source;
  const badge =
    source === "seed-edit"
      ? "AI-edited build"
      : source === "seed-fallback"
        ? "Reference build"
        : source === "agent"
          ? "AI-generated build"
          : "Generated build";

  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement === wrapRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await wrapRef.current?.requestFullscreen?.();
      return;
    }
    await document.exitFullscreen?.();
  }

  return (
    <div className="three-preview-wrap" ref={wrapRef}>
      <iframe
        title={`${gamePackage?.templateName ?? "Generated"} game`}
        className="three-preview"
        // Isolated origin: the agent's code cannot touch the parent app.
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="autoplay; fullscreen; gamepad"
      />
      <span className="generated-badge">{badge}</span>
      <button
        type="button"
        className="fullscreen-button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
        title={isFullscreen ? "Exit full screen" : "Enter full screen"}
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
}
