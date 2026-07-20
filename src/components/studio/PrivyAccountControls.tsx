import { useLogin, useLoginWithTelegram, usePrivy } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { Loader2, LogOut, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getCurrentUsername } from "@/lib/identity";
import { syncPrivyIdentity } from "@/lib/privyIdentity";
import { prefetchAuthToken } from "@/lib/api";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import {
  formatTonAddress,
  getStoredTonWallet,
  getTonWallet,
  getTonWalletErrorMessage,
  toTonWallet,
  type TonWallet,
} from "@/lib/tonWallet";

export function PrivyAccountControls({ collapsed }: { collapsed: boolean }) {
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
  const lastTonActivationAt = useRef(0);
  const identity = getCurrentUsername();
  const tonWallet = getTonWallet(user) ?? createdTonWallet ?? getStoredTonWallet();

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

  const activateTonWallet = () => {
    const now = Date.now();
    if (tonLoading || now - lastTonActivationAt.current < 500) {
      return;
    }
    lastTonActivationAt.current = now;
    void handleTonWallet();
  };

  if (!ready) {
    return (
      <div className={`mb-4 ${collapsed ? "px-0" : "px-2"}`}>
        <div className="h-10 animate-pulse rounded-xl bg-white/55" />
      </div>
    );
  }

  if (!authenticated) {
    const loading = authLoading || telegramLoading;
    return (
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className={`mb-4 flex items-center justify-center rounded-xl border border-sky-200 bg-white/75 text-sky-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 ${
          collapsed ? "size-10" : "gap-2 px-3 py-2"
        }`}
        title={inTelegram ? "Sign in with Telegram" : "Connect TON wallet"}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
        {!collapsed && (
          <span className="label-mono text-xs font-bold">
            {loading
              ? "CONNECTING..."
              : inTelegram
                ? authStatus === "openTelegram"
                  ? "OPEN TELEGRAM"
                  : authStatus === "error"
                    ? "TRY AGAIN"
                    : "TELEGRAM SIGN IN"
                : authStatus === "error"
                  ? "TRY AGAIN"
                  : "TON WALLET"}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`mb-4 space-y-2 ${collapsed ? "px-0" : "px-2"}`}>
      {!collapsed && (
        <div className="rounded-xl border border-sky-200/70 bg-white/75 px-3 py-2 text-sky-950">
          <p className="label-mono text-[10px] font-black text-sky-500">
            {inTelegram ? "TELEGRAM SIGNED IN" : "TON WALLET CONNECTED"}
          </p>
          <p className="mt-1 truncate font-mono text-xs font-bold">
            {tonWallet?.address ? formatTonAddress(tonWallet.address) : identity}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={activateTonWallet}
        onPointerUp={activateTonWallet}
        onTouchEnd={activateTonWallet}
        disabled={tonLoading}
        className={`flex items-center justify-center rounded-xl border border-sky-200 bg-white/75 text-sky-700 transition hover:bg-white hover:text-sky-950 disabled:cursor-not-allowed disabled:opacity-70 ${
          collapsed ? "size-10" : "w-full gap-2 px-3 py-2"
        }`}
        title={
          tonWallet?.address
            ? `TON wallet ${tonWallet.address}. Click to copy.`
            : tonErrorMessage
              ? `TON wallet error: ${tonErrorMessage}`
              : "Create TON wallet"
        }
      >
        {tonLoading ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
        {!collapsed && (
          <span className="label-mono truncate text-xs font-bold">
            {tonStatus === "copied"
              ? "TON COPIED"
              : tonStatus === "error"
                ? tonErrorMessage || "TON ERROR"
                : tonWallet?.address
                  ? formatTonAddress(tonWallet.address)
                  : "CREATE TON WALLET"}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => void logout()}
        className={`flex items-center justify-center rounded-xl border border-sky-200 bg-white/60 text-sky-700 transition hover:bg-white hover:text-sky-950 ${
          collapsed ? "size-10" : "w-full gap-2 px-3 py-2"
        }`}
        title="Disconnect"
      >
        <LogOut className="size-4" />
        {!collapsed && <span className="label-mono text-xs font-bold">DISCONNECT</span>}
      </button>
    </div>
  );
}
