import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { reportLovableError } from "../lib/lovable-error-reporting";
import { getWalletAddress } from "../lib/identity";

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
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03070d] px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#9a35ff]/30 bg-[#9a35ff]/10 shadow-[0_0_40px_rgba(154,53,255,0.15)]">
          <svg className="h-10 w-10 text-[#c084fc]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Wallet Not Connected
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Creator Studio requires a connected wallet. Please go to{" "}
          <strong className="text-white/70">Kult Games</strong> and connect your wallet first,
          then come back here.
        </p>
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#9a35ff] to-[#7c2bcc] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(154,53,255,0.25)] transition-all hover:shadow-[0_0_28px_rgba(154,53,255,0.4)] hover:brightness-110"
          >
            Go to Kult Games
          </a>
        </div>
      </div>
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
  const [hasWallet, setHasWallet] = useState(() => !!getWalletAddress());

  // Re-check wallet presence when the tab regains focus (e.g. user logged in
  // on the main Kult Games tab and then switched back here).
  useEffect(() => {
    const recheck = () => setHasWallet(!!getWalletAddress());
    window.addEventListener("focus", recheck);
    window.addEventListener("storage", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      window.removeEventListener("storage", recheck);
    };
  }, []);

  if (!hasWallet) {
    return <AccessDeniedComponent />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
