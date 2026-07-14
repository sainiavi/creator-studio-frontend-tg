import { useLoginWithTelegram, usePrivy } from "@privy-io/react-auth";
import { Loader2, LogOut, MessageCircle } from "lucide-react";

import { getCurrentUsername } from "@/lib/identity";
import { PRIVY_APP_ID } from "@/lib/privyConfig";

type TelegramSignInButtonProps = {
  compact?: boolean;
  responsive?: boolean;
  className?: string;
};

export function TelegramSignInButton({
  compact = false,
  responsive = false,
  className = "",
}: TelegramSignInButtonProps) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { login: loginWithTelegram, state } = useLoginWithTelegram();
  const telegramLoading = state.status === "loading";
  const identity = getCurrentUsername();

  const signInWithTelegram = async () => {
    try {
      await loginWithTelegram();
    } catch {
      login({ loginMethods: ["telegram"] });
    }
  };

  if (!PRIVY_APP_ID) {
    return null;
  }

  if (!ready) {
    return (
      <div
        className={`h-9 ${compact || responsive ? "w-9 sm:w-24" : "w-24"} animate-pulse rounded-full border border-white/15 bg-white/10 ${className}`}
      />
    );
  }

  if (authenticated) {
    return (
      <button
        type="button"
        onClick={() => void logout()}
        className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-sky-200/35 bg-white/12 text-xs font-black uppercase text-white transition hover:bg-white/20 ${
          compact || responsive ? "w-9 px-0 sm:w-auto sm:px-3" : "px-3"
        } ${className}`}
        title={`Signed in as ${identity}. Click to sign out.`}
      >
        <MessageCircle className="size-4 text-[#55c2ff]" />
        {!compact && (
          <span className={`${responsive ? "hidden sm:inline" : ""} max-w-28 truncate`}>
            {identity}
          </span>
        )}
        <LogOut className={`${responsive ? "hidden sm:block" : ""} size-3.5 text-white/70`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signInWithTelegram()}
      disabled={telegramLoading}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-[#2aabee] text-xs font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(42,171,238,0.35)] transition hover:bg-[#229ed9] disabled:cursor-not-allowed disabled:opacity-70 ${
        compact || responsive ? "w-9 px-0 sm:w-auto sm:px-3" : "px-3"
      } ${className}`}
      title="Sign in with Telegram"
    >
      {telegramLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <MessageCircle className="size-4" />
      )}
      {!compact && <span className={responsive ? "hidden sm:inline" : ""}>Telegram Sign In</span>}
    </button>
  );
}
