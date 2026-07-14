import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useLoginWithTelegram, usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, WalletCards } from "lucide-react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { PRIVY_APP_ID } from "../lib/privyConfig";
import { syncPrivyIdentity } from "../lib/privyIdentity";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function AccessDeniedComponent() {
  const { login } = usePrivy();
  const { login: loginWithTelegram, state } = useLoginWithTelegram();
  const telegramLoading = state.status === "loading";

  const signInWithTelegram = async () => {
    try {
      await loginWithTelegram();
    } catch {
      login({ loginMethods: ["telegram"] });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03070d] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#9a35ff]/30 bg-[#9a35ff]/10 shadow-[0_0_40px_rgba(154,53,255,0.15)]">
          <svg
            className="h-10 w-10 text-[#c084fc]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Sign in to Creator Studio</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Use your Telegram account or wallet through Privy. Your Creator Studio identity will be
          used for games, points, leaderboards, and referrals.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void signInWithTelegram()}
            disabled={telegramLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#9a35ff] to-[#7c2bcc] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(154,53,255,0.25)] transition-all hover:shadow-[0_0_28px_rgba(154,53,255,0.4)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {telegramLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            Continue with Telegram
          </button>
          <button
            type="button"
            onClick={() => login({ loginMethods: ["wallet"] })}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <WalletCards className="size-4" />
            Sign in with wallet
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivyMissingConfigComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03070d] px-4">
      <div className="max-w-md rounded-2xl border border-red-400/25 bg-red-500/10 p-6 text-center text-white">
        <h1 className="text-xl font-bold">Privy is not configured</h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Set VITE_PRIVY_APP_ID in the frontend environment before using Creator Studio sign in.
        </p>
      </div>
    </div>
  );
}

function PrivyLoadingComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03070d] text-white">
      <Loader2 className="size-6 animate-spin text-[#c084fc]" />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { ready, authenticated, user } = usePrivy();

  useEffect(() => {
    if (ready) syncPrivyIdentity(authenticated ? user : null);
  }, [authenticated, ready, user]);

  if (!PRIVY_APP_ID) {
    return <PrivyMissingConfigComponent />;
  }

  if (!ready) {
    return <PrivyLoadingComponent />;
  }

  if (!authenticated) {
    return <AccessDeniedComponent />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
