import { useLoginWithTelegram, usePrivy } from "@privy-io/react-auth";
import { LogOut, MessageCircle } from "lucide-react";

import { getCurrentUsername } from "@/lib/identity";

export function PrivyAccountControls({ collapsed }: { collapsed: boolean }) {
  const { ready, authenticated, logout } = usePrivy();
  const { login: loginWithTelegram, state } = useLoginWithTelegram();
  const telegramLoading = state.status === "loading";
  const identity = getCurrentUsername();

  const signInWithTelegram = async () => {
    await loginWithTelegram();
  };

  if (!ready) {
    return (
      <div className={`mb-4 ${collapsed ? "px-0" : "px-2"}`}>
        <div className="h-10 animate-pulse rounded-xl bg-white/55" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => void signInWithTelegram()}
        disabled={telegramLoading}
        className={`mb-4 flex items-center justify-center rounded-xl border border-sky-200 bg-white/75 text-sky-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 ${
          collapsed ? "size-10" : "gap-2 px-3 py-2"
        }`}
        title="Sign in with Telegram"
      >
        <MessageCircle className="size-4" />
        {!collapsed && (
          <span className="label-mono text-xs font-bold">
            {telegramLoading ? "CONNECTING..." : "TELEGRAM SIGN IN"}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`mb-4 space-y-2 ${collapsed ? "px-0" : "px-2"}`}>
      {!collapsed && (
        <div className="rounded-xl border border-sky-200/70 bg-white/75 px-3 py-2 text-sky-950">
          <p className="label-mono text-[10px] font-black text-sky-500">TELEGRAM SIGNED IN</p>
          <p className="mt-1 truncate font-mono text-xs font-bold">{identity}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => void logout()}
        className={`flex items-center justify-center rounded-xl border border-sky-200 bg-white/60 text-sky-700 transition hover:bg-white hover:text-sky-950 ${
          collapsed ? "size-10" : "w-full gap-2 px-3 py-2"
        }`}
        title="Sign out"
      >
        <LogOut className="size-4" />
        {!collapsed && <span className="label-mono text-xs font-bold">SIGN OUT</span>}
      </button>
    </div>
  );
}
