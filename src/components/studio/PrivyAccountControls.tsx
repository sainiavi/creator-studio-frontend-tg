import { Loader2, LogOut, Wallet } from "lucide-react";
import { useRef } from "react";

import { StudioSignInButton } from "@/components/studio/StudioSignInButton";
import { ZeroGWalletPanel } from "@/components/studio/ZeroGWalletPanel";
import { useStudioAuth } from "@/hooks/useStudioAuth";
import { formatTonAddress } from "@/lib/tonWallet";

export function PrivyAccountControls({ collapsed }: { collapsed: boolean }) {
  const {
    ready,
    authenticated,
    inTelegram,
    signOut,
    tonWallet,
    tonLoading,
    tonStatus,
    tonErrorMessage,
    copyTonWallet,
  } = useStudioAuth();
  const lastTonActivationAt = useRef(0);

  const activateTonWallet = () => {
    const now = Date.now();
    if (tonLoading || now - lastTonActivationAt.current < 500) return;
    lastTonActivationAt.current = now;
    void copyTonWallet();
  };

  if (!ready) {
    return (
      <div className={`mb-4 ${collapsed ? "px-0" : "px-2"}`}>
        <div className="h-10 animate-pulse rounded-xl bg-white/55" />
      </div>
    );
  }

  if (!authenticated) {
    return <StudioSignInButton variant="sidebar" compact={collapsed} />;
  }

  return (
    <div className={`mb-4 space-y-2 ${collapsed ? "px-0" : "px-2"}`}>
      {!inTelegram && !collapsed && <ZeroGWalletPanel showHeading variant="sidebar" />}

      {inTelegram && (
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
      )}

      <button
        type="button"
        onClick={signOut}
        className={`flex items-center justify-center rounded-xl border border-sky-200 bg-white/60 text-sky-700 transition hover:bg-white hover:text-sky-950 ${
          collapsed ? "size-10" : "w-full gap-2 px-3 py-2"
        }`}
        title="Sign out"
      >
        <LogOut className="size-4" />
        {!collapsed && <span className="label-mono text-xs font-bold">SIGN OUT</span>}
      </button>
    </div>
  );
}
