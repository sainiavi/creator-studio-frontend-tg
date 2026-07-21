import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import character1 from "@/assets/character1.webp";
import character2 from "@/assets/character2.webp";
import gameControllerCard from "@/assets/gameControllerCard.webp";
import { ConsoleChatMessages } from "./ConsoleChatMessages";
import { CreateConsolePanel } from "./CreateConsolePanel";
import type { ChatMessage, ChatStage } from "@/lib/createChatFlow";

/** gameControllerCard.png — 378×224 */
const CARD_W = 378;
const CARD_H = 224;

/** Clears mobile bottom nav + FAB + safe area */
const MOBILE_DOCK_CLEARANCE = "calc(7.25rem + env(safe-area-inset-bottom, 0px))";

/** LCD bounds — inset slightly so UI doesn't kiss the bezel */
const SCREEN = {
  left: 94 / CARD_W,
  top: 20 / CARD_H,
  width: 190 / CARD_W,
  height: 100 / CARD_H,
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
  messages?: ChatMessage[];
  chatStage?: ChatStage;
  onQuickReply?: (text: string) => void;
  isThinking?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onFocusChange?: (focused: boolean) => void;
  /** Show mascot characters beside the controller (home hero) */
  showSideCharacters?: boolean;
  /** Bottom offset for side characters, e.g. "42%" */
  characterBottom?: string;
  className?: string;
};

export function ConsoleHero({
  value,
  onChange,
  onSubmit,
  onCategoryPick,
  messages,
  chatStage = "game",
  onQuickReply,
  isThinking = false,
  placeholder = "Describe your game idea...",
  disabled = false,
  onFocusChange,
  showSideCharacters = true,
  characterBottom = "40%",
  className = "",
}: ConsoleHeroProps) {
  const timersRef = useRef<number[]>([]);
  const [active, setActive] = useState(false);
  const [booting, setBooting] = useState(false);
  const showMessageList = active && Boolean(messages?.length);

  useEffect(() => {
    onFocusChange?.(active || booting);
  }, [active, booting, onFocusChange]);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const openPopup = (immediate = false) => {
    if (disabled) return;
    if (!active) {
      if (immediate) {
        setActive(true);
        setBooting(false);
        return;
      }
      setBooting(true);
      const id = window.setTimeout(() => {
        setActive(true);
        setBooting(false);
      }, 280);
      timersRef.current.push(id);
    }
  };

  const closePopup = () => {
    setActive(false);
    setBooting(false);
  };

  const handleSubmit = () => {
    if (!value.trim() && chatStage !== "ready") return;
    if (!active) openPopup(true);
    onSubmit();
    if (chatStage === "ready") closePopup();
  };

  const panelProps = {
    value,
    onChange,
    onSubmit: handleSubmit,
    placeholder,
    disabled: disabled || isThinking,
    embedded: true as const,
    fillScreen: true as const,
    lockCompact: true as const,
    delegateExpand: !active,
    onExpandedChange: (next: boolean) => {
      if (next) openPopup();
    },
    onCategoryPick: (seed: string) => {
      openPopup(true);
      if (messages?.length && chatStage !== "game") {
        onQuickReply?.(seed);
      } else {
        onCategoryPick?.(seed);
      }
    },
    className: "h-full w-full",
  };

  const controllerBlock = (
    <div className="relative w-full" style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}>
      <img
        src={gameControllerCard}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none block h-full w-full select-none object-contain drop-shadow-[0_16px_36px_rgba(109,40,217,0.32)]"
      />

      <div
        className={`pointer-events-auto absolute z-20 overflow-hidden rounded-[5px] bg-[#05010f] ${
          booting ? "animate-lcd-boot" : active ? "" : "animate-lcd-idle"
        }`}
        style={{
          left: `${SCREEN.left * 100}%`,
          top: `${SCREEN.top * 100}%`,
          width: `${SCREEN.width * 100}%`,
          height: `${SCREEN.height * 100}%`,
          containerType: "size",
        }}
      >
        {booting && (
          <span className="animate-scanline pointer-events-none absolute inset-x-0 top-0 z-10 h-[40%] bg-gradient-to-b from-transparent via-fuchsia-300/50 to-transparent" />
        )}
        <CreateConsolePanel {...panelProps} />
      </div>

      <button
        type="button"
        aria-label="Generate game"
        disabled={disabled}
        onClick={() => {
          if (!active) {
            openPopup();
            return;
          }
          handleSubmit();
        }}
        className={`pointer-events-auto absolute z-40 rounded-full transition active:scale-95 disabled:opacity-50 ${
          active ? "shadow-[0_0_22px_rgba(217,70,239,0.7)]" : ""
        }`}
        style={{
          left: `${GENERATE_BTN.left * 100}%`,
          top: `${GENERATE_BTN.top * 100}%`,
          width: `${GENERATE_BTN.width * 100}%`,
          height: `${GENERATE_BTN.height * 100}%`,
        }}
      />
    </div>
  );

  return (
    <div className={`relative mx-auto w-full max-w-[520px] ${className}`}>
      {(active || booting) && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[54] bg-[#1a0a2e]/30 backdrop-blur-md"
        />
      )}

      {(active || booting) && (
        <button
          type="button"
          aria-label="Close chat"
          onClick={closePopup}
          className="fixed right-3 top-[max(3.75rem,calc(env(safe-area-inset-top,0px)+3.25rem))] z-[56] grid size-10 place-items-center rounded-full border border-fuchsia-300/35 bg-[#160b2e]/92 text-white shadow-[0_4px_20px_rgba(109,40,217,0.55)] backdrop-blur-sm transition active:scale-95"
        >
          <X className="size-5" strokeWidth={2.5} />
        </button>
      )}

      {/* Active overlay — messages fill top, controller pinned above bottom nav */}
      {active && (
        <div
          className="pointer-events-none fixed inset-x-0 top-[max(48px,7dvh)] z-[55] flex flex-col items-center justify-end gap-2 px-3"
          style={{ bottom: MOBILE_DOCK_CLEARANCE }}
        >
          {showMessageList && messages && (
            <div className="pointer-events-auto relative flex min-h-0 w-full max-w-[400px] flex-1 flex-col overflow-hidden rounded-[1.1rem] border border-fuchsia-400/40 bg-[#0a0118]/98 p-3 shadow-[0_20px_50px_rgba(109,40,217,0.45),inset_0_1px_14px_rgba(255,255,255,0.08)] backdrop-blur-md">
              <div className="pointer-events-none absolute -inset-[2px] overflow-hidden rounded-[1.15rem]">
                <div className="animate-holo-border absolute inset-[-60%] bg-[conic-gradient(from_0deg,#f472b6,#a855f7,#6366f1,#f472b6)] opacity-70 blur-[1px]" />
              </div>
              <ConsoleChatMessages
                messages={messages}
                chatStage={chatStage}
                isThinking={isThinking}
                onQuickReply={onQuickReply}
                disabled={disabled}
                className="relative min-h-0 flex-1"
              />
            </div>
          )}

          <div className="pointer-events-auto w-[min(96vw,480px)] shrink-0 scale-[1.1] origin-bottom">
            {controllerBlock}
          </div>
        </div>
      )}

      {/* Idle hero: smaller mascots behind controller; controller always visible */}
      <div className="relative mx-auto h-[clamp(300px,84vw,380px)] w-full">
        {showSideCharacters && (
          <>
            <img
              src={character1}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`pointer-events-none absolute left-0 z-[1] h-[clamp(190px,48vw,230px)] w-[42%] object-contain object-right-bottom drop-shadow-[0_8px_14px_rgba(76,29,149,0.2)] transition-all duration-500 ${
                active ? "opacity-0" : ""
              }`}
              style={{ bottom: characterBottom }}
            />
            <img
              src={character2}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`pointer-events-none absolute right-0 z-[1] h-[clamp(190px,48vw,230px)] w-[42%] object-contain object-left-bottom drop-shadow-[0_8px_14px_rgba(76,29,149,0.2)] transition-all duration-500 ${
                active ? "opacity-0" : ""
              }`}
              style={{ bottom: characterBottom }}
            />
          </>
        )}

        {!active && (
          <div
            className="absolute bottom-0 left-1/2 z-20 w-[min(100%,520px)] -translate-x-1/2 origin-bottom scale-[1.06]"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("input, button, label, textarea")) return;
              openPopup();
            }}
          >
            {controllerBlock}
          </div>
        )}
      </div>
    </div>
  );
}
