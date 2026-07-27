import { Crown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  fetchCreatorSubscriptionTiers,
  fetchMyCreatorSubscription,
  purchaseCreatorSubscription,
  type CreatorSubscriptionTier,
} from "@/lib/api/creatorSubscription";
import { usePrivyEvmWallet } from "@/lib/usePrivyEvmWallet";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";

type CreatorSubscriptionPanelProps = {
  className?: string;
};

export function CreatorSubscriptionPanel({ className = "" }: CreatorSubscriptionPanelProps) {
  const inTelegram = isTelegramMiniApp();
  const { ensureEvmWallet, getEthereumProvider } = usePrivyEvmWallet();
  const [tiers, setTiers] = useState<CreatorSubscriptionTier[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingTier, setPurchasingTier] = useState<1 | 2 | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (inTelegram) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchCreatorSubscriptionTiers(), fetchMyCreatorSubscription()])
      .then(([config, subscription]) => {
        if (cancelled) return;
        setTiers(config.tiers.filter((tier) => tier.tier === 1 || tier.tier === 2));
        setActiveSubscription(subscription);
      })
      .catch(() => {
        if (!cancelled) {
          setTiers([]);
          setActiveSubscription(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inTelegram]);

  const subscribe = async (tier: 1 | 2) => {
    try {
      setPurchasingTier(tier);
      setNotice("");
      await ensureEvmWallet();
      await purchaseCreatorSubscription(tier, 1, getEthereumProvider);
      const subscription = await fetchMyCreatorSubscription();
      setActiveSubscription(subscription);
      setNotice("Subscription active.");
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Could not activate subscription.");
    } finally {
      setPurchasingTier(null);
    }
  };

  if (inTelegram || loading) return null;

  return (
    <div className={`rounded-2xl border border-fuchsia-300/25 bg-fuchsia-400/10 p-4 text-white ${className}`}>
      <div className="flex items-center gap-2">
        <Crown className="size-4 text-fuchsia-200" />
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-fuchsia-200/85">
          Creator Subscription
        </p>
      </div>

      {activeSubscription?.active ? (
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
