import { Check, Copy, Loader2, Plus, RefreshCw, Sparkles, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";

import { getWalletAddress } from "@/lib/identity";
import { usePrivyEvmWallet } from "@/lib/usePrivyEvmWallet";
import { formatZeroGAddress, formatZeroGBalance } from "@/lib/zeroGChain";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import { cn } from "@/lib/utils";

type ZeroGWalletPanelProps = {
  className?: string;
  defaultFundAmount?: string;
  onFunded?: () => void;
  showHeading?: boolean;
  /** Dark glass popover (header) vs light sidebar card */
  variant?: "modal" | "sidebar";
};

function formatWalletSource(walletClientType?: string) {
  if (!walletClientType || walletClientType === "privy") return "Embedded wallet";
  return walletClientType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseBalanceDisplay(formatted: string) {
  const match = formatted.match(/^([\d.,]+)\s*(.*)$/);
  if (!match) return { amount: formatted, unit: "0G" };
  return { amount: match[1], unit: match[2] || "0G" };
}

export function ZeroGWalletPanel({
  className = "",
  defaultFundAmount = "10",
  onFunded,
  showHeading = true,
  variant = "modal",
}: ZeroGWalletPanelProps) {
  const inTelegram = isTelegramMiniApp();
  const isModal = variant === "modal";
  const { wallets } = useWallets();
  const {
    ensureEvmWallet,
    getWalletAddressForFunding,
    getEmbeddedWallet,
    readZeroGBalance,
    addZeroGFunds,
    linkWalletOnZeroGChain,
    walletLinkedOnSession,
  } = usePrivyEvmWallet();
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [funding, setFunding] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const activeWallet = getEmbeddedWallet();
  const walletAddress = getWalletAddressForFunding() ?? getWalletAddress();
  const walletSource = formatWalletSource(activeWallet?.walletClientType);
  const balanceLabel = balanceWei === null ? null : formatZeroGBalance(balanceWei);
  const balanceParts = useMemo(
    () => (balanceLabel ? parseBalanceDisplay(balanceLabel) : null),
    [balanceLabel],
  );

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    setLoadingBalance(true);
    try {
      await ensureEvmWallet();
      const nextBalance = await readZeroGBalance();
      setBalanceWei(nextBalance);
    } catch {
      setBalanceWei(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [ensureEvmWallet, readZeroGBalance, walletAddress]);

  useEffect(() => {
    if (inTelegram || !walletAddress) return;
    void refreshBalance();
  }, [inTelegram, refreshBalance, walletAddress, wallets.length]);

  const verifyWalletOnZeroG = useCallback(async () => {
    if (!walletAddress || walletLinkedOnSession || linkingWallet) return;
    try {
      setLinkingWallet(true);
      setNotice("Confirm the signature in your wallet on 0G Mainnet…");
      await linkWalletOnZeroGChain();
      setNotice("Wallet verified on 0G.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not verify wallet on 0G.";
      if (!/cancel|reject/i.test(message)) {
        setNotice(message);
      } else {
        setNotice("");
      }
    } finally {
      setLinkingWallet(false);
    }
  }, [linkWalletOnZeroGChain, linkingWallet, walletAddress, walletLinkedOnSession]);

  const copyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const handleAddFunds = async () => {
    try {
      setFunding(true);
      setNotice("");
      await ensureEvmWallet();
      const result = await addZeroGFunds(defaultFundAmount);
      if (result.method === "fiat" || result.method === "crypto") {
        setNotice("Funding started — balance updates in about a minute.");
        onFunded?.();
        window.setTimeout(() => void refreshBalance(), 4000);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not start funding.";
      if (!/cancel/i.test(message)) {
        setNotice(message);
      }
    } finally {
      setFunding(false);
    }
  };

  if (inTelegram || !walletAddress) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isModal
          ? "rounded-2xl text-white"
          : "rounded-xl border border-sky-200/70 bg-white/75 p-3 text-sky-950",
        className,
      )}
    >
      {isModal && (
        <>
          <div
            className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-fuchsia-500/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-6 size-28 rounded-full bg-cyan-400/20 blur-3xl"
            aria-hidden
          />
        </>
      )}

      <div className={cn("relative", isModal ? "p-1" : "")}>
        {showHeading && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl border shadow-inner",
                  isModal
                    ? "border-fuchsia-300/25 bg-gradient-to-br from-fuchsia-500/25 to-violet-600/20 text-fuchsia-100 shadow-fuchsia-500/10"
                    : "border-sky-200 bg-sky-50 text-sky-700",
                )}
              >
                <Wallet className="size-5" strokeWidth={2.2} />
              </span>
              <div>
                <p
                  className={cn(
                    "font-display text-base font-black tracking-tight",
                    isModal ? "text-white" : "text-sky-950",
                  )}
                >
                  0G Wallet
                </p>
                <p
                  className={cn(
                    "mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                    isModal ? "text-emerald-300/90" : "text-emerald-600",
                  )}
                >
                  <span className="size-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                  {walletSource}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void refreshBalance()}
              disabled={loadingBalance}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl border transition active:scale-95 disabled:opacity-50",
                isModal
                  ? "border-white/10 bg-white/5 text-white/80 hover:border-fuchsia-300/30 hover:bg-white/10 hover:text-white"
                  : "border-sky-200 bg-white text-sky-700 hover:bg-sky-50",
              )}
              title="Refresh balance"
            >
              {loadingBalance ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </button>
          </div>
        )}

        <div
          className={cn(
            "mt-4 rounded-2xl border px-4 py-5 text-center",
            isModal
              ? "border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              : "border-sky-100 bg-sky-50/80",
          )}
        >
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.18em]",
              isModal ? "text-violet-200/70" : "text-sky-500",
            )}
          >
            Available balance
          </p>
          <div className="mt-2 flex items-end justify-center gap-2">
            {balanceParts ? (
              <>
                <span
                  className={cn(
                    "font-display text-4xl font-black tabular-nums leading-none",
                    isModal
                      ? "bg-gradient-to-r from-white via-fuchsia-100 to-cyan-200 bg-clip-text text-transparent"
                      : "text-sky-950",
                  )}
                >
                  {balanceParts.amount}
                </span>
                <span
                  className={cn(
                    "pb-1 text-sm font-black uppercase tracking-wide",
                    isModal ? "text-cyan-300/90" : "text-sky-600",
                  )}
                >
                  {balanceParts.unit}
                </span>
              </>
            ) : (
              <span className="font-display text-3xl font-black opacity-40">—</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void copyAddress()}
          className={cn(
            "mt-3 flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition active:scale-[0.99]",
            isModal
              ? "border-white/10 bg-black/25 hover:border-fuchsia-300/25 hover:bg-black/35"
              : "border-sky-200 bg-white hover:bg-sky-50",
          )}
          title={walletAddress}
        >
          <div className="min-w-0">
            <p
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.14em]",
                isModal ? "text-violet-200/60" : "text-sky-400",
              )}
            >
              Wallet address
            </p>
            <p
              className={cn(
                "mt-0.5 truncate font-mono text-sm font-bold",
                isModal ? "text-white/95" : "text-sky-900",
              )}
            >
              {formatZeroGAddress(walletAddress)}
            </p>
          </div>
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg border transition",
              copied
                ? isModal
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                  : "border-emerald-300 bg-emerald-50 text-emerald-600"
                : isModal
                  ? "border-white/10 bg-white/5 text-white/70"
                  : "border-sky-200 bg-sky-50 text-sky-600",
            )}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </span>
        </button>

        {!walletLinkedOnSession && (
          <button
            type="button"
            onClick={() => void verifyWalletOnZeroG()}
            disabled={linkingWallet}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition active:scale-[0.98] disabled:opacity-60",
              isModal
                ? "border-amber-300/40 bg-amber-400/15 text-amber-50 hover:bg-amber-400/25"
                : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100",
            )}
          >
            {linkingWallet ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
            {linkingWallet ? "Waiting for signature…" : "Verify wallet on 0G"}
          </button>
        )}

        <button
          type="button"
          onClick={() => void handleAddFunds()}
          disabled={funding}
          className={cn(
            "mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-black uppercase tracking-wide transition active:scale-[0.98] disabled:opacity-60",
            isModal
              ? "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white shadow-[0_8px_28px_rgba(168,85,247,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-110"
              : "border border-sky-300 bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md hover:brightness-105",
          )}
        >
          {funding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" strokeWidth={2.5} />
          )}
          {funding ? "Opening top-up…" : "Add 0G"}
        </button>

        <p
          className={cn(
            "mt-3 flex items-start gap-2 text-[11px] leading-relaxed",
            isModal ? "text-violet-100/55" : "text-sky-600/80",
          )}
        >
          <Sparkles className="mt-0.5 size-3.5 shrink-0 opacity-70" />
          <span>
            Use this balance for paid game generations. Prefer Bitget or OKX? Sign out and choose
            wallet login on the next sign-in.
          </span>
        </p>

        {notice && (
          <p
            className={cn(
              "mt-3 rounded-xl border px-3 py-2 text-[11px] font-semibold leading-relaxed",
              isModal
                ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                : "border-sky-200 bg-sky-50 text-sky-800",
            )}
          >
            {notice}
          </p>
        )}
      </div>
    </div>
  );
}
