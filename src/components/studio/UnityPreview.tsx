import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { unityGameUrls } from "@/lib/studio-meta";

export function UnityPreview({ templateId }: { templateId: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <div className="unity-preview-wrap" ref={wrapRef}>
      <iframe
        title="Unity game preview"
        src={unityGameUrls[templateId] || "/templates/unity-karting/index.html"}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        allow="autoplay; keyboard"
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
