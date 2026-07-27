import { BrowserProvider, Contract, getAddress } from "ethers";
import { api } from "../api";
import { getWalletAddress } from "../identity";

const SUBSCRIPTION_ABI = ["function subscribe(uint8 tier, uint8 periods) payable"] as const;

export type CreatorSubscriptionTier = {
  tier: 0 | 1 | 2;
  name: string;
  priceWei: string;
  price0G: string;
};

export type CreatorSubscriptionTiers = {
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  explorerUrl: string;
  periodDays: number;
  tiers: CreatorSubscriptionTier[];
};

export async function fetchCreatorSubscriptionTiers(): Promise<CreatorSubscriptionTiers> {
  const { data } = await api.get("/creator-subscription/tiers");
  return data;
}

export async function fetchMyCreatorSubscription() {
  const { data } = await api.get("/creator-subscription/me");
  return data.subscription;
}

async function ensureChain(config: CreatorSubscriptionTiers) {
  if (!window.ethereum) throw new Error("Connect an EVM wallet to subscribe with 0G.");
  const chainId = `0x${config.chainId.toString(16)}`;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (error: unknown) {
    if (typeof error !== "object" || error === null || !("code" in error) || error.code !== 4902) {
      throw error;
    }
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          chainName: "0G Mainnet",
          nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [config.explorerUrl],
        },
      ],
    });
  }
}

export async function purchaseCreatorSubscription(tier: 1 | 2, periods = 1) {
  const config = await fetchCreatorSubscriptionTiers();
  await ensureChain(config);

  const provider = new BrowserProvider(window.ethereum!);
  const signer = await provider.getSigner();
  const signerAddress = getAddress(await signer.getAddress());
  const authenticatedWallet = getWalletAddress();
  if (!authenticatedWallet) {
    throw new Error("Link this EVM wallet to your Creator Studio account before subscribing.");
  }
  if (getAddress(authenticatedWallet) !== signerAddress) {
    throw new Error("The selected 0G wallet does not match your signed-in Creator Studio wallet.");
  }

  const { data } = await api.post("/creator-subscription/quote", { tier, periods });
  const quote = data.quote;
  const subscription = new Contract(config.contractAddress, SUBSCRIPTION_ABI, signer);
  const transaction = await subscription.subscribe(tier, periods, {
    value: BigInt(quote.dueNowWei),
  });
  await transaction.wait();

  const confirmation = await api.post("/creator-subscription/confirm", {
    txHash: transaction.hash,
  });
  return {
    txHash: transaction.hash as string,
    quote,
    subscription: confirmation.data.subscription,
  };
}
