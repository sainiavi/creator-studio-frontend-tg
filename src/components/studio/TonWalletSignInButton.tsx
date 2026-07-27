import { useLogin, useCreateWallet, useLoginWithTelegram, usePrivy } from "@privy-io/react-auth";
import { useCreateWallet as useCreateExtendedWallet } from "@privy-io/react-auth/extended-chains";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ZeroGWalletPanel } from "@/components/studio/ZeroGWalletPanel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { VITE_PRIVY_APP_ID } from "@/lib/privyConfig";
import { hasEvmWallet, syncPrivyIdentity } from "@/lib/privyIdentity";
import { clearAuthToken, prefetchAuthToken } from "@/lib/api";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import { getTonWallet, toTonWallet, type TonWallet } from "@/lib/tonWallet";

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
  const { createWallet: createTonWallet } = useCreateExtendedWallet();
  const { createWallet: createEvmWallet } = useCreateWallet();
  const inTelegram = isTelegramMiniApp();
  const telegramLoading = telegramState.status === "loading";
  const [createdTonWallet, setCreatedTonWallet] = useState<TonWallet | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "openTelegram" | "error">("idle");
  const creatingTonRef = useRef(false);
  const creatingEvmRef = useRef(false);

  const ensureTonWallet = async (nextUser = user) => {
    if (
      !inTelegram ||
      !nextUser ||
      getTonWallet(nextUser) ||
      createdTonWallet ||
      creatingTonRef.current
    ) {
      return;
    }

    try {
      creatingTonRef.current = true;
      const { user: refreshedUser, wallet } = await createTonWallet({ chainType: "ton" });
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

  const ensureEvmWallet = async (nextUser = user) => {
    if (
      inTelegram ||
      !nextUser ||
      hasEvmWallet(nextUser) ||
      creatingEvmRef.current
    ) {
      return;
    }

    try {
      creatingEvmRef.current = true;
      await createEvmWallet();
      syncPrivyIdentity(nextUser);
    } catch (error) {
      console.error("[privy] EVM wallet creation failed", error);
    } finally {
      creatingEvmRef.current = false;
    }
  };

  const { login } = useLogin({
    onComplete: ({ user: nextUser }) => {
      setAuthLoading(false);
      setAuthStatus("idle");
      syncPrivyIdentity(nextUser);
      void prefetchAuthToken();
      if (inTelegram) {
        void ensureTonWallet(nextUser);
      } else {
        void ensureEvmWallet(nextUser);
      }
    },
    onError: () => {
      setAuthLoading(false);
      setAuthStatus("error");
      window.setTimeout(() => setAuthStatus("idle"), 2000);
    },
  });

  useEffect(() => {
    if (!authenticated || !user) return;
    if (inTelegram) {
      if (getTonWallet(user) || createdTonWallet) return;
      void ensureTonWallet(user);
      return;
    }
    if (!hasEvmWallet(user)) void ensureEvmWallet(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when auth/user identity changes
  }, [authenticated, user?.id, inTelegram]);

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
    // Browser login: Google OAuth or email OTP. Privy provisions the embedded
    // Ethereum wallet configured in privyConfig (also used on 0G chain).
    setAuthLoading(true);
    setAuthStatus("idle");
    login({
      loginMethods: ["google", "email"],
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
    if (inTelegram) {
      return (
        <button
          type="button"
          onClick={() => {
            clearAuthToken();
            void logout();
          }}
          className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition hover:border-fuchsia-300/50 active:scale-95 ${className}`}
          title="Log out"
          aria-label="Log out"
        >
          <LogOut className="size-4 stroke-[1.75]" />
        </button>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition hover:border-fuchsia-300/50 active:scale-95 ${className}`}
            title="0G wallet"
            aria-label="Open 0G wallet"
          >
            <Wallet className="size-4 stroke-[1.75]" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 border-fuchsia-300/20 bg-[#160b2e] p-3 text-white">
          <ZeroGWalletPanel showHeading className="border-none bg-transparent p-0" />
          <button
            type="button"
            onClick={() => {
              clearAuthToken();
              void logout();
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-300/30 bg-black/20 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-black/30"
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </PopoverContent>
      </Popover>
    );
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
      : "0G Wallet";

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${btnClass} ${
        compact || responsive ? "sm:w-auto sm:gap-2 sm:px-3" : "w-auto gap-2 px-3"
      } ${className}`}
      title={inTelegram ? "Sign in with Telegram" : "Sign in with Google or email"}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Wallet className="size-4 stroke-[1.75]" />
      )}
      {!compact && (
        <span
          className={`text-xs font-black uppercase tracking-wide ${responsive ? "hidden sm:inline" : ""}`}
        >
          {label}
        </span>
      )}
      {compact && responsive && (
        <span className="hidden text-xs font-black uppercase tracking-wide sm:inline">{label}</span>
      )}
    </button>
  );
}
