import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/createChatFlow";
import { quickRepliesForStage } from "@/lib/createChatFlow";
import type { ChatStage } from "@/lib/createChatFlow";
import assistantAvatar from "@/assets/robot.png";
import assistantAvatar2 from "@/assets/robo.png";
import userAvatar from "@/assets/chatAvatarRight.webp";

type ConsoleChatMessagesProps = {
  messages: ChatMessage[];
  chatStage: ChatStage;
  isThinking?: boolean;
  onQuickReply?: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

// Note: this renders inline inside its parent's own scroll container (ConsoleHero's
// bottom-sheet body) — it must NOT own a scrollbar itself, or nested overflow-y-auto
// elements fight over scroll/touch input and scrolling gets stuck at the inner
// container's top/bottom edge instead of handing off to the outer sheet.
export function ConsoleChatMessages({
  messages,
  chatStage,
  isThinking = false,
  onQuickReply,
  disabled = false,
  className = "",
}: ConsoleChatMessagesProps) {
  const quickReplies = quickRepliesForStage(chatStage);
  const showCreateConfirm = chatStage === "concept" && !isThinking;

  return (
    <section className={`flex flex-col ${className}`}>
      <div className="shrink-0 space-y-2">
        {messages.map((message, index) =>
          message.role === "assistant" ? (
            <div
              key={`${message.role}-${index}`}
              className="flex w-full items-center gap-3 rounded-[1.35rem] border border-violet-400/55 bg-[linear-gradient(145deg,rgba(49,11,104,0.92),rgba(22,3,58,0.96))] p-3 shadow-[inset_0_1px_12px_rgba(255,255,255,0.06),0_8px_24px_rgba(14,2,40,0.28)]"
            >
              <div className="relative size-16 shrink-0 rounded-full border-[3px] border-violet-500 bg-[#16052f] p-1 shadow-[0_0_18px_rgba(139,92,246,0.6)]">
                <img
                  src={assistantAvatar2}
                  alt=""
                  draggable={false}
                  className="size-full rounded-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1.5 flex w-fit items-center gap-1.5 rounded-lg border border-violet-300/35 bg-violet-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-fuchsia-300">
                  <Sparkles className="size-3" /> KULT Assistance
                </p>
                <p className="text-sm font-semibold leading-snug text-violet-50 sm:text-base">
                  {message.text}
                </p>
              </div>
            </div>
          ) : (
            <div key={`${message.role}-${index}`} className="flex items-end justify-end">
              <div className="max-w-[86%] rounded-2xl bg-fuchsia-500/35 px-3 py-2 text-xs font-semibold leading-snug text-white sm:text-sm">
                {message.text}
              </div>
              <img
                src={userAvatar}
                alt=""
                draggable={false}
                className="ml-1.5 size-7 shrink-0 rounded-full object-cover ring-1 ring-fuchsia-400/40"
              />
            </div>
          ),
        )}

        {isThinking && (
          <div className="flex items-end justify-start">
            <img
              src={assistantAvatar}
              alt=""
              draggable={false}
              className="mr-2 size-9 shrink-0 rounded-full object-cover ring-2 ring-violet-500/60"
            />
            <div className="flex max-w-[86%] items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2 text-xs font-semibold text-violet-100">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {(quickReplies.length > 0 || showCreateConfirm) && onQuickReply && (
        <div className="mt-3 grid shrink-0 gap-2 border-t border-fuchsia-500/20 pt-3">
          {quickReplies.map((idea) => (
            <button
              key={idea}
              type="button"
              disabled={disabled || isThinking}
              onClick={() => onQuickReply(idea)}
              className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-violet-400/55 bg-[linear-gradient(100deg,rgba(42,8,91,0.94),rgba(20,3,55,0.96))] px-4 py-2.5 text-left text-xs font-semibold leading-snug text-violet-50 shadow-[inset_0_1px_8px_rgba(255,255,255,0.04)] transition hover:border-fuchsia-300/75 hover:bg-violet-900 active:scale-[0.99] sm:text-sm"
            >
              <span>{idea}</span>
              <ChevronRight className="size-5 shrink-0 text-violet-300 transition group-hover:translate-x-0.5 group-hover:text-fuchsia-200" />
            </button>
          ))}
          {showCreateConfirm && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onQuickReply("Ok, create it!")}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(100deg,#db2777,#7c3aed)] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(126,34,206,0.35)]"
            >
              Ok, create it! <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
