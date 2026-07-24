import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import character1 from "@/assets/left1.webp";
import character2 from "@/assets/right1.webp";
import gameControllerCard from "@/assets/center1.webp";
import kultTapHand from "@/assets/kultCartoonGlove.webp";
import robotCharacter from "@/assets/robot.png";
import creatorStudioLogo from "@/assets/creatorStudioLogo.webp";
import { ConsoleChatMessages } from "./ConsoleChatMessages";
import { CreateConsolePanel } from "./CreateConsolePanel";
import type { ChatMessage, ChatStage } from "@/lib/createChatFlow";

/** gameControllerCard.png — 378×224 */
const CARD_W = 378;
const CARD_H = 224;

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
  const sheetScrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [booting, setBooting] = useState(false);
  const showMessageList = active && Boolean(messages?.length);

  useEffect(() => {
    if (!active) return;
    const el = sheetScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [active, messages, isThinking]);

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

      {!active && !booting && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-50 -translate-x-[20%] -translate-y-[10%] rotate-6"
          style={{
            left: `${(GENERATE_BTN.left + GENERATE_BTN.width / 2) * 100}%`,
            top: `${(GENERATE_BTN.top - GENERATE_BTN.height * 0.28) * 100}%`,
            width: "calc(10% - 3px)",
          }}
        >
          <span className="pointer-events-none absolute left-[20%] top-[10%] z-20 size-[68%] -translate-x-1/2 -translate-y-1/2">
            <span className="animate-kult-tap-ring absolute inset-0 rounded-full border-[3px] border-white bg-fuchsia-400/35 shadow-[0_0_8px_3px_rgba(255,255,255,0.95),0_0_18px_7px_rgba(217,70,239,0.9)]" />
            <span className="absolute inset-[38%] animate-pulse rounded-full bg-white shadow-[0_0_9px_4px_rgba(255,255,255,1)]" />
          </span>
          <img
            src={kultTapHand}
            alt=""
            draggable={false}
            className="animate-kult-tap block h-auto w-full max-w-none drop-shadow-[0_0_5px_rgba(255,255,255,0.95)] drop-shadow-[0_0_11px_rgba(217,70,239,0.95)]"
          />
        </span>
      )}
    </div>
  );

  const overlay =
    (active || booting) &&
    createPortal(
      <>
        <div
          aria-hidden="true"
          onClick={closePopup}
          className="fixed inset-0 z-[54] bg-[#1a0a2e]/30 backdrop-blur-md"
        />

        {/* Bottom sheet — tall, fixed-height panel so it always feels spacious */}
        <div
          className={`fixed inset-x-0 bottom-0 z-[55] mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-[1.75rem] border-x border-t border-fuchsia-400/40 bg-[linear-gradient(180deg,#1a0a35_0%,#0a0118_55%)] shadow-[0_-20px_60px_rgba(109,40,217,0.5),inset_0_1px_14px_rgba(255,255,255,0.08)] backdrop-blur-md transition-transform duration-300 ease-out ${
            active ? "translate-y-0" : "translate-y-full"
          }`}
          style={{
            height: "96dvh",
            maxHeight: "900px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 rounded-t-[1.75rem] bg-[radial-gradient(circle_at_82%_18%,rgba(89,208,255,0.22),transparent_34%),radial-gradient(circle_at_28%_20%,rgba(217,70,239,0.2),transparent_48%)]" />

          <div
            ref={sheetScrollRef}
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(232,121,249,0.55)_transparent]"
          >
            <div
              className="relative shrink-0 overflow-hidden border-b border-fuchsia-300/25 bg-[linear-gradient(100deg,#210052_0%,#18053e_47%,#071d4b_100%)] px-5 pb-4 pt-4"
              style={{ minHeight: 210 }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(168,85,247,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.12)_1px,transparent_1px)] [background-size:24px_24px]" />
              <img
                src={robotCharacter}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="pointer-events-none absolute object-cover object-center opacity-95 [mask-image:linear-gradient(90deg,transparent_0%,black_22%,black_90%,transparent_100%)]"
                style={{ right: -12, top: 0, width: 220, height: 210 }}
              />
              <button
                type="button"
                aria-label="Close chat"
                onClick={closePopup}
                className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full border border-white/40 bg-[#15062f]/80 text-white shadow-[0_0_16px_rgba(168,85,247,0.35)] backdrop-blur transition active:scale-95"
              >
                <X className="size-4" strokeWidth={2.5} />
              </button>

              <div className="relative z-10 max-w-[58%]">
                <img
                  src={creatorStudioLogo}
                  alt="KULT Create"
                  draggable={false}
                  className="mb-5 h-auto object-contain object-left"
                  style={{ width: 94, maxWidth: 94 }}
                />
                <h2 className="text-[1.65rem] font-black uppercase leading-[0.98] tracking-[-0.03em] text-white">
                  Create Your
                  <span className="block bg-[linear-gradient(90deg,#ffffff,#d946ef,#7c3aed)] bg-clip-text text-transparent">
                    Next Game
                  </span>
                </h2>
                <p className="mt-3 max-w-[190px] text-xs font-medium leading-snug text-violet-100/90">
                  Describe your idea and generate a playable game instantly.
                </p>
              </div>
            </div>

            {showMessageList && messages ? (
              <div className="px-3 pb-2 pt-3">
                <ConsoleChatMessages
                  messages={messages}
                  chatStage={chatStage}
                  isThinking={isThinking}
                  onQuickReply={onQuickReply}
                  disabled={disabled}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1" />
            )}
          </div>

          <div
            className="relative z-20 shrink-0 border-t border-fuchsia-300/25 bg-[#0a0118]/95 px-3 pb-3 pt-2 shadow-[0_-14px_30px_rgba(10,1,24,0.65)] backdrop-blur-xl"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <CreateConsolePanel
              value={value}
              onChange={onChange}
              onSubmit={handleSubmit}
              onCategoryPick={(seed) => {
                if (messages?.length && chatStage !== "game") {
                  onQuickReply?.(seed);
                } else {
                  onCategoryPick?.(seed);
                }
              }}
              disabled={disabled || isThinking}
              placeholder={placeholder}
              persistExpanded
              modalTheme
            />
          </div>
        </div>
      </>,
      document.body,
    );

  return (
    <div className={`relative mx-auto w-full max-w-[520px] ${className}`}>
      {overlay}


      <div className="relative mx-auto aspect-[10/9] w-full">
        {showSideCharacters && (
          <>
            <img
              src={character1}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`pointer-events-none absolute left-[6%] z-[1] h-[54%] w-[32%] object-contain object-left-bottom drop-shadow-[0_8px_14px_rgba(76,29,149,0.2)] transition-all duration-500 ${
                active ? "opacity-0" : ""
              }`}
              style={{ bottom: characterBottom }}
            />
            <img
              src={character2}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`pointer-events-none absolute right-0 z-[1] h-[58%] w-[45%] object-contain object-right-bottom drop-shadow-[0_8px_14px_rgba(76,29,149,0.2)] transition-all duration-500 ${
                active ? "opacity-0" : ""
              }`}
              style={{ bottom: `calc(${characterBottom} + 4%)` }}
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
