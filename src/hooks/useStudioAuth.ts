import {
  useCreateWallet,
  useLogin,
  useLoginWithTelegram,
  usePrivy,
  type User,
} from "@privy-io/react-auth";
import { useCreateWallet as useCreateExtendedWallet } from "@privy-io/react-auth/extended-chains";
import { useCallback, useEffect, useRef, useState } from "react";

import { clearAuthToken, prefetchAuthToken } from "@/lib/api";
import { getStudioLoginMethods } from "@/lib/privyConfig";
import { hasEvmWallet, syncPrivyIdentity } from "@/lib/privyIdentity";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import {
  getStoredTonWallet,
  getTonWallet,
  getTonWalletErrorMessage,
  toTonWallet,
  type TonWallet,
} from "@/lib/tonWallet";

export type StudioAuthStatus = "idle" | "openTelegram" | "error";

/** Shared Privy login flow: Google, email, wallet (browser) or Telegram (mini-app). */
export function useStudioAuth() {
  const { ready, authenticated, user, login: loginModal, logout } = usePrivy();
  const { login: loginWithTelegram, state: telegramState } = useLoginWithTelegram();
  const { createWallet: createTonWallet } = useCreateExtendedWallet();
  const { createWallet: createEvmWallet } = useCreateWallet();
  const inTelegram = isTelegramMiniApp();
  const telegramLoading = telegramState.status === "loading";

  const [createdTonWallet, setCreatedTonWallet] = useState<TonWallet | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<StudioAuthStatus>("idle");
  const [tonLoading, setTonLoading] = useState(false);
  const [tonStatus, setTonStatus] = useState<"idle" | "copied" | "error">("idle");
  const [tonErrorMessage, setTonErrorMessage] = useState("");

  const creatingTonRef = useRef(false);
  const creatingEvmRef = useRef(false);

  const tonWallet = getTonWallet(user) ?? createdTonWallet ?? getStoredTonWallet();

  const ensureTonWallet = useCallback(
    async (nextUser: User | null = user) => {
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
        setTonLoading(true);
        setTonStatus("idle");
        setTonErrorMessage("");
        const { user: refreshedUser, wallet } = await createTonWallet({ chainType: "ton" });
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
    },
    [createTonWallet, createdTonWallet, inTelegram, user],
  );

  const ensureEvmWallet = useCallback(
    async (nextUser: User | null = user) => {
      if (inTelegram || !nextUser || hasEvmWallet(nextUser) || creatingEvmRef.current) {
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
    },
    [createEvmWallet, inTelegram, user],
  );

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
  }, [authenticated, createdTonWallet, ensureEvmWallet, ensureTonWallet, inTelegram, user]);

  const openLogin = useCallback(async () => {
    if (inTelegram) {
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
      return;
    }

    setAuthLoading(true);
    setAuthStatus("idle");
    // Explicit methods — never offer Telegram outside the mini-app.
    login({ loginMethods: getStudioLoginMethods() });
  }, [inTelegram, login, loginModal, loginWithTelegram]);

  const signOut = useCallback(() => {
    clearAuthToken();
    void logout();
  }, [logout]);

  const copyTonWallet = useCallback(async () => {
    if (!tonWallet?.address) {
      await ensureTonWallet(user);
      return;
    }
    try {
      await navigator.clipboard?.writeText(tonWallet.address);
      setTonStatus("copied");
    } catch {
      setTonStatus("error");
    }
    window.setTimeout(() => setTonStatus("idle"), 1600);
  }, [ensureTonWallet, tonWallet?.address, user]);

  const signInLabel = inTelegram
    ? authStatus === "openTelegram"
      ? "Open Telegram"
      : authStatus === "error"
        ? "Try again"
        : "Telegram Sign In"
    : authStatus === "error"
      ? "Try again"
      : "Sign in";

  const signInHint = inTelegram
    ? "Sign in with Telegram"
    : "Sign in with Google, email, or wallet (Bitget, OKX, MetaMask…)";

  return {
    ready,
    authenticated,
    user,
    inTelegram,
    authLoading: authLoading || telegramLoading,
    authStatus,
    signInLabel,
    signInHint,
    openLogin,
    signOut,
    tonWallet,
    tonLoading,
    tonStatus,
    tonErrorMessage,
    copyTonWallet,
    ensureTonWallet,
  };
}
