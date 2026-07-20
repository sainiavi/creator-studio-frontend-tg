import { useEffect, useRef, useState } from "react";
import character1 from "@/assets/character1.png";
import character2 from "@/assets/character2.png";
import gameControllerCard from "@/assets/gameControllerCard.png";
import { CreateConsolePanel } from "./CreateConsolePanel";

/** gameControllerCard.png — 378×224 */
const CARD_W = 378;
const CARD_H = 224;

/** Black LCD bounds on the controller face */
const SCREEN = {
  left: 100 / CARD_W,
  top: 24 / CARD_H,
  width: 178 / CARD_W,
  height: 78 / CARD_H,
} as const;

/** Circular K badge on the pedestal */
const GENERATE_BTN = {
  left: 154 / CARD_W,
  top: 172 / CARD_H,
  width: 70 / CARD_W,
  height: 52 / CARD_H,
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    onFocusChange?.(chatOpen);
  }, [chatOpen, onFocusChange]);

  const openChat = () => {
    if (disabled) return;
    setChatOpen(true);
  };

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit();
    setChatOpen(false);
  };

  const lcdPreview = value.trim() || placeholder;

  return (
    <div ref={rootRef} className={`relative mx-auto w-full max-w-[520px] ${className}`}>
      {/* Slide-up create panel — controller stays put below */}
      <div
        aria-hidden={!chatOpen}
        className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          chatOpen ? "mb-3 grid-rows-[1fr] opacity-100" : "mb-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`origin-bottom transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              chatOpen ? "translate-y-0 scale-100" : "translate-y-6 scale-[0.97]"
            }`}
          >
            <CreateConsolePanel
              key={chatOpen ? "open" : "closed"}
              startExpanded={chatOpen}
              value={value}
              onChange={onChange}
              onSubmit={handleSubmit}
              onCategoryPick={(seed) => {
                onCategoryPick?.(seed);
                setChatOpen(true);
              }}
              onExpandedChange={(expanded) => {
                if (!expanded) setChatOpen(false);
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Characters + controller */}
      <div
        className={`relative mx-auto h-[clamp(280px,78vw,340px)] w-full transition-[opacity,transform] duration-500 ease-out ${
          chatOpen ? "scale-[0.98] opacity-95" : "scale-100 opacity-100"
        }`}
      >
        {/* Left character — body in left margin, only inner edge tucks behind grip */}
        <img
          src={character1}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute bottom-[20%] left-0 z-[8] h-[clamp(188px,50vw,240px)] w-[44%] object-contain object-right-bottom drop-shadow-[0_10px_18px_rgba(76,29,149,0.22)]"
        />
        {/* Right character — body in right margin */}
        <img
          src={character2}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute bottom-[20%] right-0 z-[8] h-[clamp(188px,50vw,240px)] w-[44%] object-contain object-left-bottom drop-shadow-[0_10px_18px_rgba(76,29,149,0.22)]"
        />

        <div
          className="absolute bottom-0 left-1/2 z-10 w-[78%] -translate-x-1/2"
          style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}
        >
          <img
            src={gameControllerCard}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none block h-full w-full select-none object-contain drop-shadow-[0_14px_32px_rgba(109,40,217,0.3)]"
          />

          {/* LCD — black screen with centered input preview */}
          <button
            type="button"
            disabled={disabled}
            onClick={openChat}
            aria-label="Open game idea input"
            className="pointer-events-auto absolute flex items-start justify-center overflow-hidden rounded-[4px] bg-[#05010f] pt-[10%] transition active:scale-[0.99] disabled:opacity-50"
            style={{
              left: `${SCREEN.left * 100}%`,
              top: `${SCREEN.top * 100}%`,
              width: `${SCREEN.width * 100}%`,
              height: `${SCREEN.height * 100}%`,
            }}
          >
            <span
              className={`flex min-h-[38%] w-[88%] items-center justify-center rounded-[3px] border border-fuchsia-500/35 bg-[#12082a]/95 px-[6%] py-[8%] text-center font-semibold leading-snug ${
                value.trim()
                  ? "text-[clamp(10px,2.8vw,13px)] text-white"
                  : "text-[clamp(9px,2.5vw,12px)] text-violet-300/55"
              }`}
            >
              {lcdPreview}
            </span>
          </button>

          <button
            type="button"
            aria-label="Generate game"
            disabled={disabled}
            onClick={() => {
              if (!value.trim()) {
                openChat();
                return;
              }
              handleSubmit();
            }}
            className="pointer-events-auto absolute z-20 rounded-full transition active:scale-95 disabled:opacity-50"
            style={{
              left: `${GENERATE_BTN.left * 100}%`,
              top: `${GENERATE_BTN.top * 100}%`,
              width: `${GENERATE_BTN.width * 100}%`,
              height: `${GENERATE_BTN.height * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
