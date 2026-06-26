import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { Loader2, LogIn, MessageCircle, Wallet } from "lucide-react";
import {
  clearCreatorIdentity,
  getTonWalletAddress,
  syncCreatorIdentity,
} from "@/lib/identity";
import { getTelegramUsername, isTelegramMiniApp } from "@/lib/telegram-mini-app";

function readTelegramUsername(user: any) {
  return (
    user?.telegram?.username ??
    user?.linkedAccounts?.find((account: any) => account?.type === "telegram")?.username ??
    getTelegramUsername()
  );
}

function firstTonAddress(user: any) {
  return (
    user?.linkedAccounts?.find((account: any) => account?.type === "wallet" && account?.chainType === "ton")
      ?.address ?? null
  );
}

function AuthScreen({
  loading,
  onLogin,
}: {
  loading: boolean;
  onLogin: () => void;
}) {
  const inTelegram = isTelegramMiniApp();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03070d] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
          <MessageCircle className="size-7" />
        </div>
        <h1 className="mt-5 text-center font-display text-2xl font-black text-white">
          Creator Studio
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-white/55">
          Sign in with Telegram through Privy to create games and connect a TON wallet.
        </p>
        {inTelegram ? (
          <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            Telegram auth did not complete. Check Privy Telegram credentials, enable seamless
            auth, and set this exact Mini App domain in BotFather.
          </div>
        ) : (
          <button
            onClick={onLogin}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            <span>Login with Telegram</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function PrivyAuthGate({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets: evmWallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [tonCreating, setTonCreating] = useState(false);
  const [slowInit, setSlowInit] = useState(false);

  const tonAddress = useMemo(
    () => firstTonAddress(user) ?? getTonWalletAddress(),
    [user],
  );
  const evmAddress = evmWallets[0]?.address ?? null;

  useEffect(() => {
    if (ready) {
      setSlowInit(false);
      return;
    }
    const timeout = window.setTimeout(() => setSlowInit(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      clearCreatorIdentity();
      return;
    }

    syncCreatorIdentity({
      privyUserId: user?.id,
      telegramUsername: readTelegramUsername(user),
      tonAddress,
      evmAddress,
    });
  }, [authenticated, evmAddress, ready, tonAddress, user]);

  useEffect(() => {
    if (!ready || !authenticated || tonAddress || tonCreating) return;

    setTonCreating(true);
    void createWallet({ chainType: "ton" } as any)
      .catch(() => {
        // The user can retry from the profile/sidebar control if wallet creation fails.
      })
      .finally(() => setTonCreating(false));
  }, [authenticated, createWallet, ready, tonAddress, tonCreating]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#03070d] px-5 text-center text-white">
        <div>
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
          {slowInit && (
            <>
              <h1 className="mt-5 font-display text-xl font-black">Starting Creator Studio</h1>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/55">
                Auth is taking longer than expected. Hard refresh this page if it stays here.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <AuthScreen loading={!ready} onLogin={login} />;
  }

  return (
    <div data-ton-ready={Boolean(tonAddress)}>
      {children}
      <button
        type="button"
        onClick={logout}
        className="sr-only"
        aria-label="Logout"
      />
      {tonCreating && (
        <div className="pointer-events-none fixed right-3 top-3 z-[80] hidden items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-2 text-xs font-bold text-white/75 shadow-lg backdrop-blur sm:flex">
          <Wallet className="size-3.5" />
          Creating TON wallet
        </div>
      )}
    </div>
  );
}
