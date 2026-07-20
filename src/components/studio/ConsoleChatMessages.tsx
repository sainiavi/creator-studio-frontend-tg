import { useEffect, useRef } from "react";
import { Bot, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/createChatFlow";
import { quickRepliesForStage } from "@/lib/createChatFlow";
import type { ChatStage } from "@/lib/createChatFlow";

type ConsoleChatMessagesProps = {
  messages: ChatMessage[];
  chatStage: ChatStage;
  isThinking?: boolean;
  onQuickReply?: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ConsoleChatMessages({
  messages,
  chatStage,
  isThinking = false,
  onQuickReply,
  disabled = false,
  className = "",
}: ConsoleChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const quickReplies = quickRepliesForStage(chatStage);
  const showCreateConfirm = chatStage === "concept" && !isThinking;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isThinking]);

  return (
    <section className={`flex h-full min-h-0 flex-col ${className}`}>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(232,121,249,0.6)_transparent]"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <span className="mr-1.5 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-fuchsia-500/30">
                <Bot className="size-4 text-fuchsia-200" />
              </span>
            )}
            <div
              className={`max-w-[86%] rounded-2xl px-3 py-2 text-xs font-semibold leading-snug sm:text-sm ${
                message.role === "user"
                  ? "bg-fuchsia-500/40 text-white"
                  : "bg-white/10 text-violet-100"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <span className="mr-1.5 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-fuchsia-500/30">
              <Bot className="size-4 text-fuchsia-200" />
            </span>
            <div className="flex max-w-[86%] items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-violet-100">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {(quickReplies.length > 0 || showCreateConfirm) && onQuickReply && (
        <div className="mt-2 flex shrink-0 flex-wrap gap-1.5 border-t border-fuchsia-500/20 pt-2">
          {quickReplies.map((idea) => (
            <button
              key={idea}
              type="button"
              disabled={disabled || isThinking}
              onClick={() => onQuickReply(idea)}
              className="rounded-full border border-fuchsia-400/45 bg-[#180a3a]/90 px-2.5 py-1 text-[10px] font-bold text-violet-100"
            >
              {idea.length > 24 ? `${idea.slice(0, 22)}…` : idea}
            </button>
          ))}
          {showCreateConfirm && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onQuickReply("Ok, create it!")}
              className="rounded-full bg-fuchsia-500 px-3 py-1 text-[10px] font-black text-white"
            >
              Ok, create it!
            </button>
          )}
        </div>
      )}
    </section>
  );
}
