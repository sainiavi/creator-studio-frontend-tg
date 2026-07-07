import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { constructGameUrls } from "@/lib/studio-meta";

export function Html5Preview({ templateId }: { templateId: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameUrl = constructGameUrls[templateId];

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === wrapRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await wrapRef.current?.requestFullscreen?.();
      return;
    }
    await document.exitFullscreen?.();
  }

  return (
    <div className="html5-preview-wrap" ref={wrapRef}>
      {gameUrl ? (
        <iframe
          title="HTML5 game preview"
          src={gameUrl}
          width="100%"
          height="100%"
          style={{ border: "none" }}
          allow="autoplay; keyboard"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-[#070a12] px-6 text-center text-white">
          <div>
            <p className="font-display text-lg font-black">Template unavailable</p>
            <p className="mt-2 max-w-xs text-sm text-white/55">
              This HTML game package is not installed in the app.
            </p>
          </div>
        </div>
      )}
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
