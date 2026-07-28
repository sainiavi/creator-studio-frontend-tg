import { Check, Copy, Link2, Loader2, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useConnectWallet, usePrivy } from "@privy-io/react-auth";

import { getWalletAddress } from "@/lib/identity";
import { syncPrivyIdentity } from "@/lib/privyIdentity";
import { usePrivyEvmWallet } from "@/lib/usePrivyEvmWallet";
import { formatZeroGAddress, formatZeroGBalance } from "@/lib/zeroGChain";
import { ZERO_G_CONNECT_WALLET_OPTIONS } from "@/lib/zeroGWalletList";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";

type ZeroGWalletPanelProps = {
  className?: string;
  defaultFundAmount?: string;
  onFunded?: () => void;
  showHeading?: boolean;
};

export function ZeroGWalletPanel({
  className = "",
  defaultFundAmount = "10",
  onFunded,
  showHeading = true,
}: ZeroGWalletPanelProps) {
  const inTelegram = isTelegramMiniApp();
  const { user } = usePrivy();
  const { connectWallet } = useConnectWallet({
    onSuccess: ({ wallet }) => {
      if (user) syncPrivyIdentity(user);
      setNotice(`${wallet.walletClientType ?? "Wallet"} connected for 0G.`);
      window.setTimeout(() => void refreshBalance(), 1500);
    },
  });
  const {
    ensureEvmWallet,
    getWalletAddressForFunding,
    readZeroGBalance,
    addZeroGFunds,
  } = usePrivyEvmWallet();
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [funding, setFunding] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const walletAddress = getWalletAddressForFunding() ?? getWalletAddress();

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
  }, [inTelegram, refreshBalance, walletAddress]);

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

  const handleConnectWallet = async () => {
    try {
      setConnecting(true);
      setNotice("");
      await connectWallet(ZERO_G_CONNECT_WALLET_OPTIONS);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not open wallet picker.";
      if (!/cancel/i.test(message)) {
        setNotice(message);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleAddFunds = async () => {
    try {
      setFunding(true);
      setNotice("");
      await ensureEvmWallet();
      const result = await addZeroGFunds(defaultFundAmount);
      if (result.method === "fiat" || result.method === "crypto") {
        setNotice("Funding started. Balance may take a minute to update.");
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
    <div className={`rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-3 text-cyan-50 ${className}`}>
      {showHeading && (
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200/80">
          0G Wallet
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => void copyAddress()}
          className="flex min-w-0 items-center gap-1.5 rounded-lg border border-cyan-300/20 bg-black/20 px-2.5 py-1.5 text-left transition hover:border-cyan-200/40"
          title={walletAddress}
        >
          <span className="truncate font-mono text-xs font-bold">
            {formatZeroGAddress(walletAddress)}
          </span>
          {copied ? <Check className="size-3.5 shrink-0" /> : <Copy className="size-3.5 shrink-0" />}
        </button>
        <button
          type="button"
          onClick={() => void refreshBalance()}
          disabled={loadingBalance}
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-cyan-300/20 bg-black/20 transition hover:border-cyan-200/40 disabled:opacity-60"
          title="Refresh balance"
        >
          {loadingBalance ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
        </button>
      </div>

      <p className="mt-2 text-sm font-black tabular-nums">
        {balanceWei === null ? "—" : formatZeroGBalance(balanceWei)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void handleConnectWallet()}
          disabled={connecting || funding}
          className="flex items-center justify-center gap-2 rounded-xl border border-violet-300/35 bg-violet-400/15 px-3 py-2.5 text-xs font-black text-white transition hover:bg-violet-400/25 disabled:opacity-60"
        >
          {connecting ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
          Connect wallet
        </button>
        <button
          type="button"
          onClick={() => void handleAddFunds()}
          disabled={funding || connecting}
          className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-400/20 px-3 py-2.5 text-xs font-black text-white transition hover:bg-cyan-400/30 disabled:opacity-60"
        >
          {funding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add 0G
        </button>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-cyan-100/70">
        Bitget, OKX, MetaMask, Binance, Bybit, Coinbase, and 100+ WalletConnect options.
      </p>

      {notice && <p className="mt-2 text-[11px] font-semibold text-cyan-100/85">{notice}</p>}
    </div>
  );
}
