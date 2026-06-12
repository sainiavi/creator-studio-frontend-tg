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
  /* The fit script below sizes the canvas: every game keeps ITS OWN aspect
     ratio (square boards must not be stretched to 16:9) and is scaled as large
     as the frame allows, centered by the flex body. */
  #game { display: block; touch-action: none; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
<canvas id="game"></canvas>
<script type="module">
// Surface runtime errors to the host app (the editor turns them into
// one-click "fix this" requests for the agent).
function reportGameError(message, stack) {
  try {
    window.parent.postMessage({ __kultGameError: { message: String(message), stack: String(stack || "") } }, "*");
  } catch {}
}
// --- Canvas fit ---------------------------------------------------------------
// Scales the canvas (up or down) to the largest size that fits the frame while
// preserving the game's own aspect ratio. The element box always equals the
// painted bitmap, so pointer math that scales by getBoundingClientRect stays
// correct. Re-fits when the game resizes its canvas or the frame changes size.
(function () {
  const c = document.querySelector("#game");
  function fit() {
    if (!c || !c.width || !c.height || !innerWidth || !innerHeight) return;
    const s = Math.min(innerWidth / c.width, innerHeight / c.height);
    c.style.width = Math.round(c.width * s) + "px";
    c.style.height = Math.round(c.height * s) + "px";
  }
  try {
    new MutationObserver(fit).observe(c, { attributes: true, attributeFilter: ["width", "height"] });
  } catch {}
  addEventListener("resize", fit);
  setInterval(fit, 1000);
  fit();
})();
// --- Leaderboard score bridge -----------------------------------------------
// Games call window.reportScore(score) when a run ends. Builds that predate
// this API are covered by a HUD watcher: it reads "Score: N" style text the
// game draws each frame and submits the best value when game-over text shows.
(function () {
  let best = 0;
  let explicit = false;
  let lastSentAt = 0;
  function send(score) {
    const value = Math.max(0, Math.floor(Number(score) || 0));
    try { window.parent.postMessage({ __kultGameScore: value }, "*"); } catch {}
  }
  window.reportScore = function (score) {
    explicit = true;
    send(score);
  };
  const scoreRe = /(?:score|pts|points)\\s*[:\\-]?\\s*([0-9][0-9,]*)/i;
  const overRe = /game\\s*over|you\\s*win|you\\s*lose|you\\s*died|crashed|squashed|board\\s*cleared|out\\s*of\\s*moves|quiz\\s*complete|wins|you\\s*fell/i;
  function scan(text) {
    if (explicit) return;
    const s = String(text);
    const m = s.match(scoreRe);
    if (m) {
      const v = parseInt(m[1].replace(/,/g, ""), 10);
      if (Number.isFinite(v)) best = Math.max(best, v);
    }
    if (overRe.test(s) && Date.now() - lastSentAt > 5000) {
      lastSentAt = Date.now();
      send(best);
    }
  }
  const origFill = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
    scan(text);
    return maxWidth === undefined ? origFill.call(this, text, x, y) : origFill.call(this, text, x, y, maxWidth);
  };
  const origStroke = CanvasRenderingContext2D.prototype.strokeText;
  CanvasRenderingContext2D.prototype.strokeText = function (text, x, y, maxWidth) {
    scan(text);
    return maxWidth === undefined ? origStroke.call(this, text, x, y) : origStroke.call(this, text, x, y, maxWidth);
  };
})();
window.addEventListener("error", (event) => {
  reportGameError(event.message || event.error, event.error && event.error.stack);
});
window.addEventListener("unhandledrejection", (event) => {
  reportGameError(event.reason && event.reason.message || event.reason, event.reason && event.reason.stack);
});
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
  reportGameError(error && error.message, error && error.stack);
  console.error("Generated game runtime error", error);
}
<\/script>
</body>
</html>`;
}

export function GeneratedGameFrame({
  gamePackage,
  onScoreSubmit,
}: {
  gamePackage: AnyPackage;
  onScoreSubmit?: (score: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Scores posted by the sandboxed game (reportScore API or HUD watcher).
  useEffect(() => {
    if (!onScoreSubmit) return;
    function onMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const score = event.data?.__kultGameScore;
      if (typeof score === "number" && Number.isFinite(score) && score >= 0) {
        onScoreSubmit?.(Math.floor(score));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onScoreSubmit]);

  const code = gamePackage?.refinement?.generatedCode ?? "";
  const srcDoc = useMemo(() => buildSrcDoc(code, gamePackage), [code, gamePackage]);

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
        ref={iframeRef}
        title={`${gamePackage?.templateName ?? "Generated"} game`}
        className="three-preview"
        // Isolated origin: the agent's code cannot touch the parent app.
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        allow="autoplay; fullscreen; gamepad"
      />
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
