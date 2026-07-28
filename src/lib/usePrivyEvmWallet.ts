import {
  getEmbeddedConnectedWallet,
  useAddFunds,
  useCreateWallet,
  useFundWallet,
  usePrivy,
  useSendTransaction,
  useWallets,
  type ConnectedWallet,
} from "@privy-io/react-auth";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { useCallback, useRef } from "react";

import { getWalletAddress } from "@/lib/identity";
import { hasEvmWallet, syncPrivyIdentity } from "@/lib/privyIdentity";
import { fetchZeroGBalance } from "@/lib/zeroGWallet";
import {
  decimalToWeiHex,
  getZeroGFundWalletConfig,
  ZERO_G_CAIP2,
  ZERO_G_CHAIN_ID,
  ZERO_G_FUNDING_ENV,
  ZERO_G_NATIVE_ASSET,
  ZERO_G_TREASURY_WALLET,
} from "@/lib/zeroGChain";

function getPreferredEvmWallet(wallets: ConnectedWallet[]) {
  const external = wallets.find(
    (wallet) => wallet.type === "ethereum" && wallet.walletClientType !== "privy",
  );
  return external ?? getEmbeddedConnectedWallet(wallets) ?? null;
}

export function usePrivyEvmWallet() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
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
      syncPrivyIdentity(user);
      return getEmbeddedWallet();
    } finally {
      creatingEvmRef.current = false;
    }
  }, [createWallet, getEmbeddedWallet, user]);

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

      const wallet = getEmbeddedWallet() ?? (await ensureEvmWallet());
      if (!wallet) {
        throw new Error("Your 0G wallet is not ready yet. Sign in again.");
      }

      await wallet.switchChain(ZERO_G_CHAIN_ID);
      const { hash } = await sendTransaction(
        {
          to: ZERO_G_TREASURY_WALLET,
          value: decimalToWeiHex(amount0G),
          chainId: ZERO_G_CHAIN_ID,
        },
        {
          address: wallet.address,
          fundWalletConfig: getZeroGFundWalletConfig(String(amount0G)),
        },
      );
      return hash;
    },
    [ensureEvmWallet, getEmbeddedWallet, sendTransaction],
  );

  const ensureEvmWalletForUser = useCallback(
    async (nextUser: Parameters<typeof hasEvmWallet>[0]) => {
      if (hasEvmWallet(nextUser) || getEmbeddedWallet()) {
        syncPrivyIdentity(nextUser);
        return getEmbeddedWallet();
      }
      const wallet = await ensureEvmWallet();
      syncPrivyIdentity(user ?? nextUser);
      return wallet;
    },
    [ensureEvmWallet, getEmbeddedWallet, user],
  );

  return {
    hasEvmWallet: Boolean(getEmbeddedWallet()),
    ensureEvmWallet,
    ensureEvmWalletForUser,
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
