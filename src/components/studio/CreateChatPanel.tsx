import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { Bot, Loader2, Wand2 } from "lucide-react";
import type { ChatMessage, ChatStage } from "@/lib/createChatFlow";
import { quickRepliesForStage } from "@/lib/createChatFlow";

type CreateChatPanelProps = {
  messages: ChatMessage[];
  chatStage: ChatStage;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onQuickReply: (text: string) => void;
  onExpandedChange?: (expanded: boolean) => void;
  delegateExpand?: boolean;
  startExpanded?: boolean;
  isThinking?: boolean;
  placeholder?: string;
  disabled?: boolean;
  embedded?: boolean;
  fillScreen?: boolean;
  /** Fixed console popup — reserved message space, small input, no outer scroll */
  consoleLayout?: boolean;
  className?: string;
};

export function CreateChatPanel({
  messages,
  chatStage,
  value,
  onChange,
  onSubmit,
  onQuickReply,
  onExpandedChange,
  delegateExpand = false,
  startExpanded = false,
  isThinking = false,
  placeholder = "Describe your game idea...",
  disabled = false,
  embedded = false,
  fillScreen = false,
  consoleLayout = false,
  className = "",
}: CreateChatPanelProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startExpanded) {
      onExpandedChange?.(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [startExpanded, onExpandedChange]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
    if (event.key === "Escape") onExpandedChange?.(false);
  };

  const quickReplies = quickRepliesForStage(chatStage);
  const showCreateConfirm = chatStage === "concept" && !isThinking;
  const showChips = !consoleLayout && (quickReplies.length > 0 || showCreateConfirm);

  const shellClass = consoleLayout
    ? "flex h-full min-h-0 w-full flex-col overflow-hidden"
    : fillScreen
      ? "box-border flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden bg-transparent"
      : embedded
        ? "flex h-full min-h-0 flex-col overflow-hidden"
        : "flex min-h-0 flex-col overflow-hidden";

  const bubbleUser = consoleLayout
    ? "max-w-[82%] rounded-2xl bg-fuchsia-500/40 px-3 py-2 text-xs font-semibold leading-snug text-white"
    : fillScreen
      ? "max-w-[92%] rounded-[3px] bg-fuchsia-500/35 px-[5%] py-[4%] text-[length:clamp(5px,10cqh,8px)] font-semibold leading-snug text-white"
      : "max-w-[88%] rounded-xl bg-fuchsia-500/35 px-3 py-2 text-xs font-semibold leading-snug text-white sm:text-sm";

  const bubbleAssistant = consoleLayout
    ? "max-w-[82%] rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold leading-snug text-violet-100"
    : fillScreen
      ? "max-w-[92%] rounded-[3px] bg-white/10 px-[5%] py-[4%] text-[length:clamp(5px,10cqh,8px)] font-semibold leading-snug text-violet-100"
      : "max-w-[88%] rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold leading-snug text-violet-100 sm:text-sm";

  const inputShellClass = consoleLayout
    ? "mt-2 flex h-10 shrink-0 items-center gap-2 rounded-xl border border-fuchsia-500/60 bg-[#12082a] px-3"
    : fillScreen
      ? "rounded-[2px] px-[4%] py-[5%]"
      : "rounded-xl px-2.5 py-2 shadow-[0_0_12px_rgba(168,85,247,0.28)] sm:px-3";

  const inputClass = consoleLayout
    ? "min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-300/55"
    : fillScreen
      ? "min-w-0 flex-1 bg-transparent text-[length:clamp(6px,12cqh,9px)] font-semibold text-white outline-none placeholder:text-violet-300/50"
      : "min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-violet-300/60";

  const sendButtonClass = consoleLayout
    ? "grid size-8 shrink-0 place-items-center rounded-lg bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white disabled:opacity-50"
    : fillScreen
      ? "grid aspect-square h-[85%] max-h-full shrink-0 place-items-center rounded-[3px] bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white disabled:opacity-50"
      : "grid size-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#f472b6,#a855f7)] text-white shadow-[0_0_12px_rgba(217,70,239,0.6)] disabled:opacity-50 sm:size-10";

  return (
    <section className={`${shellClass} ${className}`}>
      {/* Message area — reserved space; empty above when few messages */}
      <div
        className={`flex min-h-0 flex-1 flex-col justify-end overflow-hidden ${
          consoleLayout ? "space-y-2 pb-1" : fillScreen ? "mb-[2%] space-y-[3%] pr-[2%]" : "mb-2 space-y-2 pr-1"
        }`}
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex shrink-0 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (consoleLayout || !fillScreen) && (
              <span
                className={`mr-1.5 grid shrink-0 place-items-center rounded-full bg-fuchsia-500/30 ${
                  consoleLayout ? "mt-0.5 size-7" : "mt-1 size-6"
                }`}
              >
                <Bot className={consoleLayout ? "size-4 text-fuchsia-200" : "size-3.5 text-fuchsia-200"} />
              </span>
            )}
            <div className={message.role === "user" ? bubbleUser : bubbleAssistant}>{message.text}</div>
          </div>
        ))}

        {isThinking && (
          <div className="flex shrink-0 justify-start">
            {consoleLayout && (
              <span className="mr-1.5 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-fuchsia-500/30">
                <Bot className="size-4 text-fuchsia-200" />
              </span>
            )}
            <div className={`flex items-center gap-1.5 ${bubbleAssistant}`}>
              <Loader2 className="size-3.5 animate-spin" />
              <span>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {showChips && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {quickReplies.map((idea) => (
            <button
              key={idea}
              type="button"
              disabled={disabled || isThinking}
              onClick={() => onQuickReply(idea)}
              className="shrink-0 rounded-full border border-fuchsia-400/45 bg-[#180a3a]/90 px-2.5 py-1 text-[10px] font-bold text-violet-100"
            >
              {idea.length > 22 ? `${idea.slice(0, 20)}…` : idea}
            </button>
          ))}
          {showCreateConfirm && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onQuickReply("Ok, create it!")}
              className="shrink-0 rounded-full bg-fuchsia-500 px-3 py-1 text-[10px] font-black text-white"
            >
              Ok, create it!
            </button>
          )}
        </div>
      )}

      <label
        htmlFor={inputId}
        className={`flex shrink-0 items-center gap-[2%] border border-fuchsia-500/70 bg-[#12082a] ${inputShellClass}`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            if (delegateExpand) onExpandedChange?.(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            chatStage === "game"
              ? placeholder
              : chatStage === "vibe"
                ? "Describe the vibe…"
                : chatStage === "concept"
                  ? 'Say "Ok, create it!" or tweak…'
                  : "Add more detail or tap Generate…"
          }
          disabled={disabled || isThinking}
          className={inputClass}
        />
        <button
          type="button"
          aria-label="Send message"
          disabled={disabled || isThinking || !value.trim()}
          onClick={() => {
            if (delegateExpand && !startExpanded) onExpandedChange?.(true);
            onSubmit();
          }}
          className={sendButtonClass}
        >
          <Wand2 className={consoleLayout ? "size-4" : fillScreen ? "size-[length:clamp(6px,10cqh,9px)]" : "size-4"} />
        </button>
      </label>
    </section>
  );
}
