import { useLogin, useLoginWithTelegram, usePrivy } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { Loader2, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { VITE_PRIVY_APP_ID } from "@/lib/privyConfig";
import { syncPrivyIdentity } from "@/lib/privyIdentity";
import { prefetchAuthToken } from "@/lib/api";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import {
  getTonWallet,
  toTonWallet,
  type TonWallet,
} from "@/lib/tonWallet";

type TonWalletSignInButtonProps = {
  compact?: boolean;
  responsive?: boolean;
  className?: string;
};

export function TonWalletSignInButton({
  compact = false,
  responsive = false,
  className = "",
}: TonWalletSignInButtonProps) {
  const { ready, authenticated, login: loginModal, user } = usePrivy();
  const { login: loginWithTelegram, state: telegramState } = useLoginWithTelegram();
  const { createWallet } = useCreateWallet();
  const inTelegram = isTelegramMiniApp();
  const telegramLoading = telegramState.status === "loading";
  const [createdTonWallet, setCreatedTonWallet] = useState<TonWallet | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "openTelegram" | "error">("idle");
  const creatingTonRef = useRef(false);

  const ensureTonWallet = async (nextUser = user) => {
    if (!nextUser || getTonWallet(nextUser) || createdTonWallet || creatingTonRef.current) {
      return;
    }

    try {
      creatingTonRef.current = true;
      const { user: refreshedUser, wallet } = await createWallet({ chainType: "ton" });
      const nextWallet = toTonWallet(wallet) ?? getTonWallet(refreshedUser);
      setCreatedTonWallet(nextWallet);
      syncPrivyIdentity(refreshedUser);
      if (!nextWallet) {
        console.warn("[privy] TON wallet creation completed without returning a TON wallet.");
      }
    } catch (error) {
      console.error("[privy] TON wallet creation failed", error);
    } finally {
      creatingTonRef.current = false;
    }
  };

  const { login } = useLogin({
    onComplete: ({ user: nextUser }) => {
      setAuthLoading(false);
      setAuthStatus("idle");
      syncPrivyIdentity(nextUser);
      void prefetchAuthToken();
      void ensureTonWallet(nextUser);
    },
    onError: () => {
      setAuthLoading(false);
      setAuthStatus("error");
      window.setTimeout(() => setAuthStatus("idle"), 2000);
    },
  });

  useEffect(() => {
    if (!authenticated || !user) return;
    if (getTonWallet(user) || createdTonWallet) return;
    void ensureTonWallet(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when auth/user identity changes
  }, [authenticated, user?.id]);

  const signInWithTelegram = async () => {
    if (!inTelegram) {
      setAuthStatus("openTelegram");
      window.alert("Open this app inside Telegram to sign in with Telegram.");
      window.setTimeout(() => setAuthStatus("idle"), 2000);
      return;
    }

    try {
      setAuthStatus("idle");
      setAuthLoading(true);
      await loginWithTelegram();
      setAuthLoading(false);
    } catch {
      try {
        loginModal({ loginMethods: ["telegram"] });
      } catch {
        setAuthLoading(false);
        setAuthStatus("error");
        window.setTimeout(() => setAuthStatus("idle"), 2000);
      }
    }
  };

  const signInWithTonWallet = () => {
    // Privy has no "TON Wallet" login button. Web path = email verify, then we
    // create an embedded TON wallet. Telegram stays on the mini-app path only.
    setAuthLoading(true);
    setAuthStatus("idle");
    login({
      loginMethods: ["email"],
    });
  };

  const signIn = () => {
    if (inTelegram) {
      void signInWithTelegram();
      return;
    }
    signInWithTonWallet();
  };

  if (!VITE_PRIVY_APP_ID) {
    return null;
  }

  if (!ready) {
    return (
      <div
        className={`size-9 animate-pulse rounded-full border border-white/15 bg-[#38bdf8]/35 ${className}`}
      />
    );
  }

  if (authenticated) {
    return null;
  }

  const loading = authLoading || telegramLoading;
  const btnClass = inTelegram
    ? "bg-[#2aabee] shadow-[0_0_16px_rgba(42,171,238,0.45)] hover:bg-[#229ed9]"
    : "bg-[#38bdf8] shadow-[0_0_16px_rgba(56,189,248,0.45)] hover:bg-[#0ea5e9]";
  const label = inTelegram
    ? authStatus === "openTelegram"
      ? "Open Telegram"
      : authStatus === "error"
        ? "Try again"
        : "Telegram Sign In"
    : authStatus === "error"
      ? "Try again"
      : "TON Wallet";

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${btnClass} ${
        compact || responsive ? "sm:w-auto sm:gap-2 sm:px-3" : "w-auto gap-2 px-3"
      } ${className}`}
      title={inTelegram ? "Sign in with Telegram" : "Connect TON wallet"}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4 stroke-[1.75]" />}
      {!compact && <span className={`text-xs font-black uppercase tracking-wide ${responsive ? "hidden sm:inline" : ""}`}>{label}</span>}
      {compact && responsive && (
        <span className="hidden text-xs font-black uppercase tracking-wide sm:inline">{label}</span>
      )}
    </button>
  );
}
