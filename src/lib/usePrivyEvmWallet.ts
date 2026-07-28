import {
  getEmbeddedConnectedWallet,
  useAddFunds,
  useCreateWallet,
  useFundWallet,
  usePrivy,
  useWallets,
  type ConnectedWallet,
} from "@privy-io/react-auth";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { useCallback, useRef } from "react";

import { getWalletAddress } from "@/lib/identity";
import { hasEvmWallet, syncSessionWalletIdentity } from "@/lib/privyIdentity";
import { ensureWalletLinkedOnZeroG, isWalletLinkedOnSession } from "@/lib/walletLink";
import { fetchZeroGBalance } from "@/lib/zeroGWallet";
import {
  getZeroGFundWalletConfig,
  humanZeroGToWei,
  parseHumanZeroGAmount,
  ZERO_G_CAIP2,
  ZERO_G_CHAIN_ID,
  ZERO_G_FUNDING_ENV,
  ZERO_G_NATIVE_ASSET,
  ZERO_G_TREASURY_WALLET,
} from "@/lib/zeroGChain";
import { formatWalletError } from "@/lib/walletErrors";

function getPreferredEvmWallet(wallets: ConnectedWallet[]) {
  const external = wallets.find(
    (wallet) => wallet.type === "ethereum" && wallet.walletClientType !== "privy",
  );
  return external ?? getEmbeddedConnectedWallet(wallets) ?? null;
}

export function usePrivyEvmWallet() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const { addFunds } = useAddFunds();
  const { fundWallet } = useFundWallet();
  const creatingEvmRef = useRef(false);

  const getEmbeddedWallet = useCallback(() => {
    return getPreferredEvmWallet(wallets);
  }, [wallets]);

  const getWalletAddressForFunding = useCallback(() => {
    return getWalletAddress() ?? getEmbeddedWallet()?.address ?? null;
  }, [getEmbeddedWallet]);

  const ensureEvmWallet = useCallback(async () => {
    const existing = getEmbeddedWallet();
    if (existing || creatingEvmRef.current) return existing;

    try {
      creatingEvmRef.current = true;
      await createWallet();
      syncSessionWalletIdentity(user, wallets);
      return getEmbeddedWallet();
    } finally {
      creatingEvmRef.current = false;
    }
  }, [createWallet, getEmbeddedWallet, user, wallets]);

  const getEthereumProvider = useCallback(async () => {
    const wallet = getEmbeddedWallet() ?? (await ensureEvmWallet());
    if (!wallet) {
      throw new Error("Your 0G wallet is not ready yet. Sign in again.");
    }
    await wallet.switchChain(ZERO_G_CHAIN_ID);
    return wallet.getEthereumProvider();
  }, [ensureEvmWallet, getEmbeddedWallet]);

  const readZeroGBalance = useCallback(async () => {
    const address = getWalletAddressForFunding() ?? (await ensureEvmWallet())?.address;
    if (!address) return 0n;
    return fetchZeroGBalance(address);
  }, [ensureEvmWallet, getWalletAddressForFunding]);

  const addZeroGFunds = useCallback(
    async (defaultAmount = "10") => {
      const wallet = getEmbeddedWallet() ?? (await ensureEvmWallet());
      const address = wallet?.address ?? getWalletAddressForFunding();
      if (!address) {
        throw new Error("Your 0G wallet is not ready yet. Sign in again.");
      }

      return addFunds({
        destination: {
          address,
          chain: ZERO_G_CAIP2,
          asset: ZERO_G_NATIVE_ASSET,
        },
        fiat: {
          source: {
            assets: ["usd"],
            defaultAsset: "usd",
          },
          environment: ZERO_G_FUNDING_ENV,
          defaultAmount,
        },
        crypto: {
          slippageBps: 100,
        },
      });
    },
    [addFunds, ensureEvmWallet, getEmbeddedWallet, getWalletAddressForFunding],
  );

  const fundZeroGWallet = useCallback(
    async (amount = "10") => {
      const address = getWalletAddressForFunding() ?? (await ensureEvmWallet())?.address;
      if (!address) {
        throw new Error("Your 0G wallet is not ready yet. Sign in again.");
      }

      return fundWallet({
        address,
        options: getZeroGFundWalletConfig(amount),
      });
    },
    [ensureEvmWallet, fundWallet, getWalletAddressForFunding],
  );

  const sendZeroGGenerationPayment = useCallback(
    async (amount0G: number | string) => {
      const from = getWalletAddress();
      if (!from) {
        throw new Error("Connect your wallet before generating a paid game.");
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(ZERO_G_TREASURY_WALLET)) {
        throw new Error("0G treasury wallet is not configured.");
      }

      const humanAmount = parseHumanZeroGAmount(amount0G);
      const wei = humanZeroGToWei(humanAmount);

      try {
        const provider = await getEthereumProvider();
        const browserProvider = new BrowserProvider(provider);
        const signer = await browserProvider.getSigner();
        const tx = await signer.sendTransaction({
          to: ZERO_G_TREASURY_WALLET,
          value: wei,
        });
        return tx.hash;
      } catch (error) {
        throw new Error(formatWalletError(error, { action: `pay ${humanAmount} 0G` }));
      }
    },
    [getEthereumProvider],
  );

  const ensureEvmWalletForUser = useCallback(
    async (nextUser: Parameters<typeof hasEvmWallet>[0]) => {
      if (hasEvmWallet(nextUser, wallets) || getEmbeddedWallet()) {
        syncSessionWalletIdentity(nextUser, wallets);
        return getEmbeddedWallet();
      }
      const wallet = await ensureEvmWallet();
      syncSessionWalletIdentity(user ?? nextUser, wallets);
      return wallet;
    },
    [ensureEvmWallet, getEmbeddedWallet, user, wallets],
  );

  const linkWalletOnZeroGChain = useCallback(async () => {
    const wallet = getEmbeddedWallet();
    const address = wallet?.address ?? getWalletAddress();
    if (!address) {
      throw new Error("Connect your wallet first.");
    }
    syncSessionWalletIdentity(user ?? null, wallets);
    return ensureWalletLinkedOnZeroG(address, getEthereumProvider);
  }, [getEmbeddedWallet, getEthereumProvider, user, wallets]);

  return {
    hasEvmWallet: Boolean(getEmbeddedWallet()),
    walletLinkedOnSession: isWalletLinkedOnSession(
      getWalletAddressForFunding() ?? getEmbeddedWallet()?.address ?? null,
    ),
    ensureEvmWallet,
    ensureEvmWalletForUser,
    linkWalletOnZeroGChain,
    getEmbeddedWallet,
    getEthereumProvider,
    getWalletAddressForFunding,
    readZeroGBalance,
    addZeroGFunds,
    fundZeroGWallet,
    sendZeroGGenerationPayment,
  };
}

export async function getBrowserProviderFromPrivy(getEthereumProvider: () => Promise<Eip1193Provider>) {
  const provider = await getEthereumProvider();
  return new BrowserProvider(provider);
}
