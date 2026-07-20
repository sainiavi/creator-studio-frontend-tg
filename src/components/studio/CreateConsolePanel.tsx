import { useId, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { Sparkles, Swords, Trophy, Volleyball, Wand2 } from "lucide-react";

export type CreateCategory = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  seed: string;
};

export const defaultCreateCategories: CreateCategory[] = [
  { label: "Sports", icon: Volleyball, seed: "Sports game with exciting levels and quick matches" },
  { label: "Racing", icon: Trophy, seed: "Fast arcade racing game with drift boosts" },
  { label: "RPG", icon: Swords, seed: "Fantasy RPG adventure with quests and loot" },
  { label: "More", icon: Sparkles, seed: "Creative arcade game with unique mechanics" },
];

type CreateConsolePanelProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCategoryPick?: (seed: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Fits inside the handheld console screen on home/create heroes */
  embedded?: boolean;
  /** Edge-to-edge inside the console LCD clip (no card chrome) */
  fillScreen?: boolean;
  className?: string;
};

export function CreateConsolePanel({
  value,
  onChange,
  onSubmit,
  onCategoryPick,
  onExpandedChange,
  placeholder = "Describe your game idea...",
  disabled = false,
  embedded = false,
  fillScreen = false,
  className = "",
}: CreateConsolePanelProps) {
  const inputId = useId();
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState(false);

  const setExpandedState = (next: boolean) => {
    setExpanded(next);
    onExpandedChange?.(next);
  };

  const collapse = () => setExpandedState(false);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit();
    collapse();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
    if (event.key === "Escape") collapse();
  };

  const pickCategory = (seed: string) => {
    onChange(value.trim() ? value : seed);
    onCategoryPick?.(seed);
    setExpandedState(true);
    requestAnimationFrame(() => fieldRef.current?.focus());
  };

  const shellClass = fillScreen
    ? "box-border flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden bg-transparent px-[3%] py-[2%]"
    : embedded
      ? "flex h-full min-h-0 flex-col rounded-sm bg-[#090018]/96 px-[clamp(4px,1.2vw,7px)] py-[clamp(4px,1.2vw,6px)] shadow-[inset_0_1px_8px_rgba(255,255,255,0.06)]"
      : "rounded-[1.2rem] border border-fuchsia-300/45 bg-[#090018]/95 p-3 shadow-[0_0_24px_rgba(124,58,237,0.4),inset_0_1px_12px_rgba(255,255,255,0.1)] sm:rounded-[1.35rem] sm:p-4";

  const headingClass = fillScreen
    ? "mb-[1%] h-[10%] shrink-0 content-center font-display text-[length:clamp(4px,10cqh,7px)] font-black uppercase leading-none tracking-[0.02em] text-fuchsia-400"
    : embedded
      ? "mb-[clamp(2px,0.6vw,3px)] shrink-0 font-display text-[clamp(4px,1.15vw,5.5px)] font-black uppercase tracking-[0.05em] text-fuchsia-400"
      : "mb-2 font-display text-[10px] font-black uppercase tracking-[0.12em] text-fuchsia-300 sm:text-xs";

  const fieldShellClass = expanded
    ? fillScreen
      ? "flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col gap-[3%] overflow-hidden rounded-[2px] border border-fuchsia-500/80 bg-[#12082a] p-[4%] box-border"
      : embedded
        ? "flex min-h-0 flex-1 flex-col gap-[4%] rounded-[3px] border border-fuchsia-500/80 bg-[#12082a] p-[4%]"
        : "flex min-h-[148px] flex-col gap-2 rounded-xl border-2 border-fuchsia-300 bg-[#16082f] p-2.5 shadow-[0_0_20px_rgba(217,70,239,0.55),inset_0_1px_10px_rgba(255,255,255,0.1)] sm:min-h-[168px] sm:p-3"
    : fillScreen
      ? "box-border flex h-[52%] w-full max-w-full min-w-0 shrink-0 items-center gap-[2%] overflow-hidden rounded-[2px] border border-fuchsia-500/70 bg-[#12082a] px-[4%] py-[6%]"
      : embedded
        ? "flex shrink-0 items-center gap-[2%] rounded-[2px] border border-fuchsia-500/70 bg-[#12082a] px-[3%] [height:34%]"
        : "flex min-h-[3.5rem] items-center gap-2 rounded-xl border border-fuchsia-400/70 bg-[#190b3d] px-2.5 py-2 shadow-[0_0_12px_rgba(168,85,247,0.32),inset_0_1px_8px_rgba(255,255,255,0.08)] sm:min-h-16 sm:px-3 sm:py-2.5";

  const inputClass = expanded
    ? embedded || fillScreen
      ? "min-h-0 min-w-0 max-w-full flex-1 w-full resize-none overflow-y-auto overflow-x-hidden bg-transparent text-[length:clamp(6px,14cqh,10px)] font-semibold leading-tight text-white outline-none placeholder:text-violet-300/55 [scrollbar-width:thin] box-border"
      : "min-h-[80px] w-full resize-none bg-transparent text-sm font-semibold leading-relaxed text-white outline-none placeholder:text-violet-300/70 sm:min-h-[96px] sm:text-base"
    : embedded || fillScreen
      ? "min-w-0 flex-1 bg-transparent text-[length:clamp(5px,12cqh,8px)] font-semibold text-white outline-none placeholder:text-violet-300/50"
      : "min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-violet-300/70";

  const sendButtonClass = fillScreen
    ? "grid aspect-square h-[85%] max-h-full shrink-0 place-items-center rounded-[3px] bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white disabled:opacity-60"
    : embedded
      ? "grid size-[clamp(16px,4.6vw,20px)] shrink-0 place-items-center rounded bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white disabled:opacity-60"
      : "grid size-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white shadow-[0_0_14px_rgba(217,70,239,0.85)] disabled:opacity-60 sm:size-11";

  const iconSize = fillScreen
    ? "size-[length:clamp(6px,10cqh,9px)]"
    : embedded
      ? "size-[clamp(8px,2.2vw,10px)]"
      : "size-4";

  return (
    <section className={`${shellClass} ${className}`}>
      <p className={`${headingClass} ${fillScreen && expanded ? "sr-only" : ""}`}>What do you want to create?</p>

      <label htmlFor={inputId} className={`${fieldShellClass} transition-all duration-200 ease-out`}>
        {expanded ? (
          <>
            <textarea
              id={inputId}
              ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!value.trim()) collapse();
              }}
              placeholder={placeholder}
              disabled={disabled}
              rows={embedded ? 2 : 4}
              className={inputClass}
            />
            <div className="flex shrink-0 items-center justify-end gap-1">
              <button
                type="button"
                onClick={collapse}
                className={`rounded-full border border-white/15 font-bold text-violet-200 transition hover:bg-white/10 ${
                  fillScreen
                    ? "px-1 py-px text-[length:clamp(4px,9cqh,6px)]"
                    : embedded
                      ? "px-1.5 py-px text-[7px]"
                      : "px-2.5 py-1 text-[10px]"
                }`}
              >
                Done
              </button>
              <button
                type="button"
                aria-label="Start creating"
                disabled={disabled || !value.trim()}
                onClick={handleSubmit}
                className={sendButtonClass}
              >
                <Wand2 className={iconSize} />
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              id={inputId}
              ref={fieldRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onFocus={() => setExpandedState(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={inputClass}
            />
            <button
              type="button"
              aria-label="Start creating"
              disabled={disabled}
              onClick={() => {
                setExpandedState(true);
                if (value.trim()) handleSubmit();
              }}
              className={sendButtonClass}
            >
              <Wand2 className={iconSize} />
            </button>
          </>
        )}
      </label>

      {!expanded && (
        <div
          className={`grid min-h-0 grid-cols-4 ${
            fillScreen
              ? "mt-[2%] grid min-h-0 w-full max-w-full flex-1 grid-cols-4 gap-[2%]"
              : embedded
                ? "mt-[clamp(2px,0.6vw,3px)] gap-[clamp(1px,0.45vw,2px)]"
                : "mt-2 gap-1.5 sm:mt-3 sm:gap-2"
          }`}
        >
          {defaultCreateCategories.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                disabled={disabled}
                onClick={() => pickCategory(item.seed)}
                className={
                  fillScreen
                    ? "box-border flex h-full min-h-0 flex-col items-center justify-center gap-[8%] rounded-[2px] border border-fuchsia-500/55 bg-[#180a3a]/90 px-[6%] py-[10%] text-violet-50"
                    : embedded
                      ? "grid aspect-[1.05] place-items-center rounded border border-fuchsia-500/60 bg-[#180a3a] text-violet-50"
                      : "grid aspect-[1.05] place-items-center rounded-lg border border-fuchsia-400/55 bg-[#180a3a] py-1.5 text-violet-50"
                }
              >
                <Icon
                  className={
                    fillScreen
                      ? "size-[length:clamp(8px,16cqh,12px)]"
                      : embedded
                        ? "size-[clamp(8px,2.2vw,10px)]"
                        : "size-3.5 sm:size-4"
                  }
                />
                <span
                  className={
                    fillScreen
                      ? "text-[length:clamp(4px,9cqh,6px)] font-black leading-none"
                      : embedded
                        ? "text-[clamp(3.5px,1vw,4.5px)] font-black leading-none"
                        : "mt-0.5 text-[9px] font-black sm:text-[10px]"
                  }
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
