import {
  useCreateWallet,
  useLogin,
  usePrivy,
  useWallets,
  type User,
} from "@privy-io/react-auth";
import { useCreateWallet as useCreateExtendedWallet } from "@privy-io/react-auth/extended-chains";
import { useCallback, useEffect, useRef, useState } from "react";

import { clearAuthToken, prefetchAuthToken } from "@/lib/api";
import { getWalletAddress } from "@/lib/identity";
import { getStudioLoginMethods } from "@/lib/privyConfig";
import { hasEvmWallet, syncSessionWalletIdentity } from "@/lib/privyIdentity";
import { usePrivyEvmWallet } from "@/lib/usePrivyEvmWallet";
import { clearWalletLinkSession } from "@/lib/walletLink";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import {
  getStoredTonWallet,
  getTonWallet,
  getTonWalletErrorMessage,
  toTonWallet,
  type TonWallet,
} from "@/lib/tonWallet";

export type StudioAuthStatus = "idle" | "error";

/** Shared Privy login flow: Google, email, or wallet. */
export function useStudioAuth() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { linkWalletOnZeroGChain } = usePrivyEvmWallet();
  const { createWallet: createTonWallet } = useCreateExtendedWallet();
  const { createWallet: createEvmWallet } = useCreateWallet();
  const inTelegram = isTelegramMiniApp();

  const [createdTonWallet, setCreatedTonWallet] = useState<TonWallet | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<StudioAuthStatus>("idle");
  const [tonLoading, setTonLoading] = useState(false);
  const [tonStatus, setTonStatus] = useState<"idle" | "copied" | "error">("idle");
  const [tonErrorMessage, setTonErrorMessage] = useState("");

  const creatingTonRef = useRef(false);
  const creatingEvmRef = useRef(false);
  const syncedWalletRef = useRef<string | null>(null);

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
        syncSessionWalletIdentity(refreshedUser, wallets);
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
    [createTonWallet, createdTonWallet, inTelegram, user, wallets],
  );

  const ensureEvmWallet = useCallback(
    async (nextUser: User | null = user) => {
      if (inTelegram || !nextUser || hasEvmWallet(nextUser, wallets) || creatingEvmRef.current) {
        return;
      }

      try {
        creatingEvmRef.current = true;
        await createEvmWallet();
        syncSessionWalletIdentity(nextUser, wallets);
      } catch (error) {
        console.error("[privy] EVM wallet creation failed", error);
      } finally {
        creatingEvmRef.current = false;
      }
    },
    [createEvmWallet, inTelegram, user, wallets],
  );

  const { login } = useLogin({
    onComplete: ({ user: nextUser }) => {
      setAuthLoading(false);
      setAuthStatus("idle");
      syncSessionWalletIdentity(nextUser, wallets);
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
    if (!hasEvmWallet(user, wallets)) void ensureEvmWallet(user);
  }, [authenticated, createdTonWallet, ensureEvmWallet, ensureTonWallet, inTelegram, user, wallets]);

  const openLogin = useCallback(async () => {
    setAuthLoading(true);
    setAuthStatus("idle");
    login({ loginMethods: getStudioLoginMethods() });
  }, [login]);

  const syncWalletIdentity = useCallback(async () => {
    if (!user) return null;
    const address = syncSessionWalletIdentity(user, wallets);
    if (!address) return null;
    syncedWalletRef.current = address;
    return address;
  }, [user, wallets]);

  const signOut = useCallback(() => {
    syncedWalletRef.current = null;
    clearWalletLinkSession();
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

  const signInLabel = authStatus === "error" ? "Try again" : "Sign in";

  const signInHint = "Sign in with Google, email, or wallet (Bitget, OKX, MetaMask…)";

  return {
    ready,
    authenticated,
    user,
    inTelegram,
    authLoading,
    authStatus,
    signInLabel,
    signInHint,
    openLogin,
    signOut,
    syncWalletIdentity,
    linkWalletOnZeroGChain,
    tonWallet,
    tonLoading,
    tonStatus,
    tonErrorMessage,
    copyTonWallet,
    ensureTonWallet,
  };
}
