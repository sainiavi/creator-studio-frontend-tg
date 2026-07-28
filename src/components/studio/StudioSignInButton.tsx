import { Loader2, LogOut, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { WalletAccountPopover } from "@/components/studio/WalletAccountPopover";
import { useStudioAuth } from "@/hooks/useStudioAuth";
import { VITE_PRIVY_APP_ID } from "@/lib/privyConfig";
import { cn } from "@/lib/utils";

type StudioSignInButtonProps = {
  /** header = app nav pill, sidebar = nav drawer, profile = full-width profile gate */
  variant?: "header" | "sidebar" | "profile";
  compact?: boolean;
  responsive?: boolean;
  className?: string;
};

export function StudioSignInButton({
  variant = "header",
  compact = false,
  responsive = false,
  className = "",
}: StudioSignInButtonProps) {
  const {
    ready,
    authenticated,
    inTelegram,
    authLoading,
    signInLabel,
    signInHint,
    openLogin,
    signOut,
  } = useStudioAuth();

  if (!VITE_PRIVY_APP_ID) return null;

  if (!ready) {
    if (variant === "profile") {
      return <div className="mt-5 h-11 animate-pulse rounded-xl bg-white/10" />;
    }
    return (
      <div
        className={cn(
          "animate-pulse rounded-full border border-white/15 bg-[#38bdf8]/35",
          variant === "header" ? "size-9" : "h-10 w-full rounded-xl",
          className,
        )}
      />
    );
  }

  if (authenticated) {
    if (variant === "header") {
      if (inTelegram) {
        return (
          <button
            type="button"
            onClick={signOut}
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition hover:border-fuchsia-300/50 active:scale-95",
              className,
            )}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-4 stroke-[1.75]" />
          </button>
        );
      }

      return (
        <WalletAccountPopover onSignOut={signOut}>
          <button
            type="button"
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/25 bg-[#160b2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_10px_rgba(88,28,135,0.35)] transition hover:border-fuchsia-300/50 hover:shadow-[0_0_20px_rgba(217,70,239,0.25)] active:scale-95",
              className,
            )}
            title="Account & 0G wallet"
            aria-label="Open account and wallet"
          >
            <Wallet className="size-4 stroke-[1.75]" />
          </button>
        </WalletAccountPopover>
      );
    }

    return null;
  }

  const loading = authLoading;
  const onClick = () => void openLogin();

  if (variant === "profile") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        title={signInHint}
        className={cn(
          "mt-5 w-full rounded-xl bg-[linear-gradient(90deg,#d946ef,#7c3aed)] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_22px_rgba(168,85,247,0.35)] transition hover:brightness-110 disabled:opacity-70",
          className,
        )}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Connecting…
          </span>
        ) : (
          signInLabel
        )}
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        title={signInHint}
        className={cn(
          "mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white/75 px-3 py-2 text-sky-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70",
          compact ? "size-10 px-0" : "",
          className,
        )}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
        {!compact && (
          <span className="label-mono text-xs font-bold">
            {loading ? "CONNECTING..." : signInLabel.toUpperCase()}
          </span>
        )}
      </button>
    );
  }

  const btnClass = inTelegram
    ? "bg-[#2aabee] shadow-[0_0_16px_rgba(42,171,238,0.45)] hover:bg-[#229ed9]"
    : "bg-[#38bdf8] shadow-[0_0_16px_rgba(56,189,248,0.45)] hover:bg-[#0ea5e9]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={signInHint}
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center rounded-full text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70",
        btnClass,
        compact || responsive ? "w-9 sm:w-auto sm:gap-2 sm:px-3" : "w-auto gap-2 px-3",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Wallet className="size-4 stroke-[1.75]" />
      )}
      {!compact && (
        <span
          className={cn(
            "text-xs font-black uppercase tracking-wide",
            responsive ? "hidden sm:inline" : "",
          )}
        >
          {signInLabel}
        </span>
      )}
      {compact && responsive && (
        <span className="hidden text-xs font-black uppercase tracking-wide sm:inline">
          {signInLabel}
        </span>
      )}
    </button>
  );
}

/** Profile gate card — same login flow as the header button. */
export function StudioSignInGate({
  title,
  description,
  footer,
}: {
  title: string;
  description: string;
  footer?: ReactNode;
}) {
  const { signInHint } = useStudioAuth();

  return (
    <section className="w-full max-w-sm rounded-[1.75rem] border border-fuchsia-300/30 bg-[#16062f]/95 p-6 text-center shadow-[0_18px_50px_rgba(44,10,91,0.45)]">
      <Wallet className="mx-auto size-10 text-fuchsia-300" />
      <h1 className="mt-4 font-display text-xl font-black">{title}</h1>
      <p className="mt-2 text-sm text-violet-200">{description}</p>
      <p className="mt-3 text-[11px] leading-relaxed text-violet-300/80">{signInHint}</p>
      <StudioSignInButton variant="profile" />
      {footer}
    </section>
  );
}
