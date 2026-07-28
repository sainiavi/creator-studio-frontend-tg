import { Crown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

import {
  fetchCreatorSubscriptionTiers,
  fetchMyCreatorSubscription,
  purchaseCreatorSubscription,
  type CreatorSubscriptionTier,
} from "@/lib/api/creatorSubscription";
import { getWalletAddress } from "@/lib/identity";
import { usePrivyEvmWallet } from "@/lib/usePrivyEvmWallet";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";
import { useStudioAuth } from "@/hooks/useStudioAuth";
import { isWalletLinkedOnSession } from "@/lib/walletLink";
import { getWalletErrorPresentation } from "@/lib/walletErrors";

type CreatorSubscriptionPanelProps = {
  className?: string;
};

function subscriptionErrorMessage(error: unknown): string {
  const response = (error as { response?: { data?: { error?: string; code?: string } } })?.response;
  if (response?.data?.code === "EVM_WALLET_REQUIRED") {
    return "Your wallet is connected in the app but not linked to your account yet. Use the wallet panel above, then try again.";
  }
  return response?.data?.error ?? (error instanceof Error ? error.message : "Could not load subscription.");
}

export function CreatorSubscriptionPanel({ className = "" }: CreatorSubscriptionPanelProps) {
  const inTelegram = isTelegramMiniApp();
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { syncWalletIdentity } = useStudioAuth();
  const { ensureEvmWallet, getEthereumProvider, readZeroGBalance, linkWalletOnZeroGChain } =
    usePrivyEvmWallet();
  const [tiers, setTiers] = useState<CreatorSubscriptionTier[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingTier, setPurchasingTier] = useState<1 | 2 | null>(null);
  const [notice, setNotice] = useState("");
  const [walletLinked, setWalletLinked] = useState(false);
  const loadKeyRef = useRef<string | null>(null);

  const walletAddress = getWalletAddress() ?? "";
  const connectedWalletKey = useMemo(
    () =>
      wallets
        .map((wallet) => wallet.address?.toLowerCase() ?? "")
        .filter(Boolean)
        .sort()
        .join(","),
    [wallets],
  );
  const loadKey = useMemo(
    () => `${authenticated ? user?.id ?? "" : ""}:${connectedWalletKey || walletAddress}`,
    [authenticated, connectedWalletKey, user?.id, walletAddress],
  );

  const loadSubscriptionState = useCallback(async () => {
    setLoading(true);
    setNotice("");
    try {
      await ensureEvmWallet();
      await syncWalletIdentity();
      const linked = isWalletLinkedOnSession(getWalletAddress());
      setWalletLinked(linked);
      const config = await fetchCreatorSubscriptionTiers();
      setTiers(config.tiers.filter((tier) => tier.tier === 1 || tier.tier === 2));
      if (!linked) {
        setActiveSubscription(null);
        return;
      }
      const subscription = await fetchMyCreatorSubscription();
      setActiveSubscription(subscription);
    } catch (error: unknown) {
      setTiers([]);
      setActiveSubscription(null);
      setNotice(subscriptionErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [ensureEvmWallet, syncWalletIdentity]);

  useEffect(() => {
    if (inTelegram || !ready || !authenticated) {
      loadKeyRef.current = null;
      setLoading(false);
      return;
    }
    if (loadKeyRef.current === loadKey) return;
    loadKeyRef.current = loadKey;
    void loadSubscriptionState();
  }, [authenticated, inTelegram, loadKey, loadSubscriptionState, ready]);

  const subscribe = async (tier: 1 | 2) => {
    try {
      setPurchasingTier(tier);
      setNotice("");
      await ensureEvmWallet();
      await syncWalletIdentity();
      const wallet = getWalletAddress();
      if (!wallet) {
        setNotice("Connect your 0G wallet using the panel above, then try subscribing again.");
        return;
      }
      if (!isWalletLinkedOnSession(wallet)) {
        setNotice("Sign once in your wallet on 0G to link it, then subscribe.");
        await linkWalletOnZeroGChain();
        setWalletLinked(true);
      }
      const plan = tiers.find((item) => item.tier === tier);
      const balance = await readZeroGBalance();
      const funding = formatZeroGShortfall(balance, plan?.price0G);
      if (!funding.sufficient) {
        setNotice(
          `You have ${funding.balanceLabel} but ${plan?.name ?? "this plan"} costs ${funding.priceLabel}.`,
        );
        return;
      }
      setNotice(`Confirm ${plan?.name ?? "subscription"} (${funding.priceLabel}) in your wallet…`);
      await purchaseCreatorSubscription(tier, 1, getEthereumProvider);
      const subscription = await fetchMyCreatorSubscription();
      setActiveSubscription(subscription);
      setWalletLinked(true);
      setNotice("Subscription active.");
      loadKeyRef.current = null;
      void loadSubscriptionState();
    } catch (error: unknown) {
      const { message } = getWalletErrorPresentation(error, { action: "subscribe with 0G" });
      setNotice(message);
    } finally {
      setPurchasingTier(null);
    }
  };

  if (inTelegram || !authenticated || !ready) return null;
  if (loading) {
    return (
      <div className={`rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/10 p-4 text-white ${className}`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-100/85">
          <Loader2 className="size-4 animate-spin" />
          Loading Creator subscription…
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/10 p-4 text-white ${className}`}>
      <div className="flex items-center gap-2">
        <Crown className="size-4 text-fuchsia-200" />
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-200/85">
          Creator Subscription
        </p>
      </div>

      {!walletLinked ? (
        <p className="mt-3 text-xs font-semibold text-fuchsia-100/85">
          Connect your 0G wallet in the panel above to view plans and subscribe.
        </p>
      ) : activeSubscription?.active ? (
        <div className="mt-3 rounded-xl border border-fuchsia-300/20 bg-black/20 px-3 py-2.5">
          <p className="text-sm font-black">{activeSubscription.tierName ?? "Active plan"}</p>
          <p className="mt-1 text-xs font-semibold text-fuchsia-100/80">
            {activeSubscription.expiresAt
              ? `Renews / expires ${new Date(activeSubscription.expiresAt).toLocaleDateString()}`
              : "Active on your 0G wallet"}
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-fuchsia-100/85">
            Subscribe with 0G to generate more games after your free build.
          </p>
          {tiers.map((tier) => (
            <button
              key={tier.tier}
              type="button"
              disabled={purchasingTier !== null}
              onClick={() => void subscribe(tier.tier as 1 | 2)}
              className="flex w-full items-center justify-between rounded-xl border border-fuchsia-300/30 bg-fuchsia-400/15 px-3 py-2.5 text-left transition hover:bg-fuchsia-400/25 disabled:opacity-60"
            >
              <span className="text-sm font-black">{tier.name}</span>
              <span className="flex items-center gap-2 text-xs font-bold text-fuchsia-100/85">
                {tier.price0G} 0G
                {purchasingTier === tier.tier && <Loader2 className="size-3.5 animate-spin" />}
              </span>
            </button>
          ))}
        </div>
      )}

      {notice && <p className="mt-2 text-[11px] font-semibold text-fuchsia-100/85">{notice}</p>}
    </div>
  );
}
