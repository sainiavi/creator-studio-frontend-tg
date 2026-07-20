import { useState } from "react";
import heroFrame from "@/assets/hero-frame.png";
import { CreateConsolePanel } from "./CreateConsolePanel";

/** hero-frame.png native size */
const HERO_W = 640;
const HERO_H = 571;

/**
 * Inner LCD rect — inset ~8% inside measured black pixels so UI never
 * touches the white console bezel (640×571 asset, y≈305–410 band).
 */
const SCREEN = {
  left: 176 / HERO_W,
  top: 312 / HERO_H,
  width: 298 / HERO_W,
  height: 108 / HERO_H,
} as const;

type ConsoleHeroProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCategoryPick?: (seed: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onFocusChange?: (focused: boolean) => void;
  className?: string;
};

export function ConsoleHero({
  value,
  onChange,
  onSubmit,
  onCategoryPick,
  placeholder = "Describe your game idea...",
  disabled = false,
  onFocusChange,
  className = "",
}: ConsoleHeroProps) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandedChange = (next: boolean) => {
    setExpanded(next);
    onFocusChange?.(next);
  };

  return (
    <div
      className={`relative mx-auto w-full max-w-[520px] origin-center px-0 transition-transform duration-300 ease-out ${
        expanded ? "z-30 scale-[1.14]" : "scale-100"
      } ${className}`}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: `${HERO_W} / ${HERO_H}` }}
      >
        <img
          src={heroFrame}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none block h-full w-full select-none object-contain"
        />

        <div
          className="pointer-events-auto absolute box-border overflow-hidden"
          style={{
            left: `${SCREEN.left * 100}%`,
            top: `${SCREEN.top * 100}%`,
            width: `${SCREEN.width * 100}%`,
            height: `${SCREEN.height * 100}%`,
            containerType: "size",
          }}
        >
          <CreateConsolePanel
            embedded
            fillScreen
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            onCategoryPick={onCategoryPick}
            onExpandedChange={handleExpandedChange}
            placeholder={placeholder}
            disabled={disabled}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
