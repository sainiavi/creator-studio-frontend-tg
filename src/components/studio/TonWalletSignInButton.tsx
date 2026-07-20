import { useLogin, useLoginWithTelegram, usePrivy } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getCurrentUsername } from "@/lib/identity";
import { VITE_PRIVY_APP_ID } from "@/lib/privyConfig";
import { syncPrivyIdentity } from "@/lib/privyIdentity";
import { prefetchAuthToken } from "@/lib/api";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import {
  formatTonAddress,
  getTonWallet,
  getTonWalletErrorMessage,
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
  const { ready, authenticated, login: loginModal, logout, user } = usePrivy();
  const { login: loginWithTelegram, state: telegramState } = useLoginWithTelegram();
  const { createWallet } = useCreateWallet();
  const inTelegram = isTelegramMiniApp();
  const telegramLoading = telegramState.status === "loading";
  const [createdTonWallet, setCreatedTonWallet] = useState<TonWallet | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "openTelegram" | "error">("idle");
  const [tonLoading, setTonLoading] = useState(false);
  const [tonStatus, setTonStatus] = useState<"idle" | "copied" | "error">("idle");
  const [tonErrorMessage, setTonErrorMessage] = useState("");
  const creatingTonRef = useRef(false);
  const identity = getCurrentUsername();
  const tonWallet = getTonWallet(user) ?? createdTonWallet;

  const ensureTonWallet = async (nextUser = user) => {
    if (!nextUser || getTonWallet(nextUser) || createdTonWallet || creatingTonRef.current) {
      return;
    }

    try {
      creatingTonRef.current = true;
      setTonLoading(true);
      setTonStatus("idle");
      setTonErrorMessage("");
      const { user: refreshedUser, wallet } = await createWallet({ chainType: "ton" });
      const nextWallet = toTonWallet(wallet) ?? getTonWallet(refreshedUser);
      setCreatedTonWallet(nextWallet);
      syncPrivyIdentity(refreshedUser);
      if (!nextWallet) {
        const message = "Privy returned successfully, but no TON wallet was found on the user.";
        setTonErrorMessage(message);
        setTonStatus("error");
      }
    } catch (error) {
      const message = getTonWalletErrorMessage(error);
      console.error("[privy] TON wallet creation failed", error);
      setTonErrorMessage(message);
      setTonStatus("error");
    } finally {
      creatingTonRef.current = false;
      setTonLoading(false);
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

  const handleTonWallet = async () => {
    if (!authenticated) {
      signIn();
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

    await ensureTonWallet(user);
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
    const mobileLabel = tonLoading ? "..." : tonStatus === "error" ? "!" : "TON";

    return (
      <div className={`inline-flex h-9 shrink-0 items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={() => void handleTonWallet()}
          disabled={tonLoading}
          className={`inline-flex h-9 items-center justify-center gap-2 rounded-full border border-sky-200/35 bg-white/12 text-xs font-black uppercase text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70 ${
            compact ? "w-9 px-0" : responsive ? "w-auto px-2 sm:px-3" : "px-3"
          }`}
          title={
            tonWallet?.address
              ? `TON wallet ${tonWallet.address}. Click to copy.`
              : tonErrorMessage
                ? `TON wallet error: ${tonErrorMessage}`
                : `Signed in as ${identity}. Click to create TON wallet.`
          }
        >
          {tonLoading ? (
            <Loader2 className="size-4 animate-spin text-[#55c2ff]" />
          ) : (
            <Wallet className="size-4 text-[#55c2ff]" />
          )}
          {!compact && (
            <>
              <span className={responsive ? "inline sm:hidden" : "hidden"}>{mobileLabel}</span>
              <span className={`${responsive ? "hidden sm:inline" : ""} max-w-28 truncate`}>
                {tonStatus === "copied" ? "Copied" : tonStatus === "error" ? "Try again" : label}
              </span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => void logout()}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white ${
            compact && responsive ? "hidden sm:inline-flex" : ""
          }`}
          title="Disconnect"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    );
  }

  const loading = authLoading || telegramLoading;
  const btnClass = inTelegram
    ? "bg-[#2aabee] shadow-[0_0_18px_rgba(42,171,238,0.35)] hover:bg-[#229ed9]"
    : "bg-[#0098EA] shadow-[0_0_18px_rgba(0,152,234,0.35)] hover:bg-[#0088d1]";
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
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full text-xs font-black uppercase tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${btnClass} ${
        compact || responsive ? "w-9 px-0 sm:w-auto sm:px-3" : "px-3"
      } ${className}`}
      title={inTelegram ? "Sign in with Telegram" : "Connect TON wallet"}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
      {!compact && <span className={responsive ? "hidden sm:inline" : ""}>{label}</span>}
    </button>
  );
}
