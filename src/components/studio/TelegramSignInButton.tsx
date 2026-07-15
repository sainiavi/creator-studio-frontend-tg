import { useLoginWithTelegram, usePrivy } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { useState } from "react";

import { getCurrentUsername } from "@/lib/identity";
import { VITE_PRIVY_APP_ID } from "@/lib/privyConfig";
import { syncPrivyIdentity } from "@/lib/privyIdentity";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import { formatTonAddress, getTonWallet, toTonWallet, type TonWallet } from "@/lib/tonWallet";

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
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { login: loginWithTelegram, state } = useLoginWithTelegram();
  const { createWallet } = useCreateWallet();
  const telegramLoading = state.status === "loading";
  const canUseTelegramLogin = isTelegramMiniApp();
  const [createdTonWallet, setCreatedTonWallet] = useState<TonWallet | null>(null);
  const [authStatus, setAuthStatus] = useState<"idle" | "openTelegram" | "error">("idle");
  const [tonLoading, setTonLoading] = useState(false);
  const [tonStatus, setTonStatus] = useState<"idle" | "copied" | "error">("idle");
  const identity = getCurrentUsername();
  const tonWallet = getTonWallet(user) ?? createdTonWallet;

  const signInWithTelegram = async () => {
    if (!canUseTelegramLogin) {
      setAuthStatus("openTelegram");
      window.alert("Open this app inside Telegram to sign in.");
      window.setTimeout(() => setAuthStatus("idle"), 2000);
      return;
    }

    try {
      setAuthStatus("idle");
      await loginWithTelegram();
    } catch {
      try {
        login({ loginMethods: ["telegram"] });
      } catch {
        setAuthStatus("error");
        window.setTimeout(() => setAuthStatus("idle"), 2000);
      }
    }
  };

  const handleTonWallet = async () => {
    if (!authenticated) {
      await signInWithTelegram();
      return;
    }

    if (tonWallet?.address) {
      try {
        await navigator.clipboard?.writeText(tonWallet.address);
        setTonStatus("copied");
      } catch {
        setTonStatus("error");
      }
      window.setTimeout(() => setTonStatus("idle"), 1600);
      return;
    }

    try {
      setTonLoading(true);
      setTonStatus("idle");
      const { user: nextUser, wallet } = await createWallet({ chainType: "ton" });
      const nextWallet = toTonWallet(wallet) ?? getTonWallet(nextUser);
      setCreatedTonWallet(nextWallet);
      syncPrivyIdentity(nextUser);
      if (!nextWallet) {
        setTonStatus("error");
      }
    } catch {
      setTonStatus("error");
      window.setTimeout(() => setTonStatus("idle"), 2000);
    } finally {
      setTonLoading(false);
    }
  };

  if (!VITE_PRIVY_APP_ID) {
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
    const label = tonWallet?.address
      ? formatTonAddress(tonWallet.address)
      : tonLoading
        ? "Creating"
        : "Create TON";

    return (
      <div className={`inline-flex h-9 shrink-0 items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={() => void handleTonWallet()}
          disabled={tonLoading}
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border border-sky-200/35 bg-white/12 text-xs font-black uppercase text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70 ${
            compact || responsive ? "w-9 px-0 sm:w-auto sm:px-3" : "px-3"
          }`}
          title={
            tonWallet?.address
              ? `TON wallet ${tonWallet.address}. Click to copy.`
              : `Signed in as ${identity}. Click to create TON wallet.`
          }
        >
          {tonLoading ? (
            <Loader2 className="size-4 animate-spin text-[#55c2ff]" />
          ) : (
            <Wallet className="size-4 text-[#55c2ff]" />
          )}
          {!compact && (
            <span className={`${responsive ? "hidden sm:inline" : ""} max-w-28 truncate`}>
              {tonStatus === "copied" ? "Copied" : tonStatus === "error" ? "Try again" : label}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
          title="Disconnect"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
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
      title={canUseTelegramLogin ? "Sign in with Telegram" : "Open in Telegram to sign in"}
    >
      {telegramLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Wallet className="size-4" />
      )}
      {!compact && (
        <span className={responsive ? "hidden sm:inline" : ""}>
          {authStatus === "openTelegram"
            ? "Open Telegram"
            : authStatus === "error"
              ? "Try again"
              : "Telegram Sign In"}
        </span>
      )}
    </button>
  );
}
