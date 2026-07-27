import { useId, type KeyboardEvent } from "react";
import { Wand2 } from "lucide-react";
import type { ChatStage } from "@/lib/createChatFlow";

type ConsoleChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  chatStage?: ChatStage;
  placeholder?: string;
  disabled?: boolean;
  /** Fits inside the controller LCD */
  lcd?: boolean;
  className?: string;
};

export function ConsoleChatInput({
  value,
  onChange,
  onSubmit,
  onFocus,
  chatStage = "game",
  placeholder = "Describe your game idea...",
  disabled = false,
  lcd = false,
  className = "",
}: ConsoleChatInputProps) {
  const inputId = useId();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const placeholderText =
    chatStage === "game"
      ? placeholder
      : chatStage === "vibe"
        ? "Describe the vibe…"
        : "Add more detail…";

  return (
    <label
      htmlFor={inputId}
      className={`flex w-full items-center gap-1.5 border border-fuchsia-500/65 bg-[#12082a] ${
        lcd
          ? "h-full rounded-[3px] px-[6%] py-[8%]"
          : "h-10 rounded-xl px-3 shadow-[0_0_12px_rgba(168,85,247,0.28)]"
      } ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholderText}
        disabled={disabled}
        className={
          lcd
            ? "min-w-0 flex-1 bg-transparent text-[clamp(7px,2.1vw,9px)] font-semibold text-white outline-none placeholder:text-violet-300/50"
            : "min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-300/55"
        }
      />
      <button
        type="button"
        aria-label="Send message"
        disabled={disabled || !value.trim()}
        onClick={(event) => {
          event.stopPropagation();
          onSubmit();
        }}
        className={
          lcd
            ? "grid aspect-square h-[78%] max-h-[22px] shrink-0 place-items-center rounded-[2px] bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white disabled:opacity-50"
            : "grid size-8 shrink-0 place-items-center rounded-lg bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white disabled:opacity-50"
        }
      >
        <Wand2 className={lcd ? "size-[clamp(7px,2vw,9px)]" : "size-4"} />
      </button>
    </label>
  );
}
