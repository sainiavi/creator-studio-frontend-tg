import { getWalletAddress } from "@/lib/identity";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
    };
  }
}

const ZERO_G_CHAIN_ID = Number(import.meta.env.VITE_ZERO_G_MAINNET_CHAIN_ID || 16661);
const ZERO_G_RPC_URL = import.meta.env.VITE_ZERO_G_MAINNET_RPC_URL || "https://evmrpc.0g.ai";
const ZERO_G_TREASURY_WALLET = import.meta.env.VITE_ZERO_G_TREASURY_WALLET || "";

function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

function decimalToWeiHex(amount: number | string) {
  const [whole, fraction = ""] = String(amount).split(".");
  const fractionWei = `${fraction.slice(0, 18)}${"0".repeat(Math.max(0, 18 - fraction.length))}`;
  const wei = BigInt(whole || "0") * 10n ** 18n + BigInt(fractionWei || "0");
  return `0x${wei.toString(16)}`;
}

async function ensureZeroGMainnet() {
  if (!window.ethereum) throw new Error("Connect a wallet to pay with 0G.");
  const chainIdHex = toHexChainId(ZERO_G_CHAIN_ID);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error: any) {
    if (error?.code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: "0G Mainnet",
          nativeCurrency: {
            name: "0G",
            symbol: "0G",
            decimals: 18,
          },
          rpcUrls: [ZERO_G_RPC_URL],
          blockExplorerUrls: ["https://chainscan.0g.ai"],
        },
      ],
    });
  }
}

export async function sendZeroGGenerationPayment(amount0G: number | string) {
  const from = getWalletAddress();
  if (!from) throw new Error("Connect your wallet before generating a paid game.");
  if (!/^0x[a-fA-F0-9]{40}$/.test(ZERO_G_TREASURY_WALLET)) {
    throw new Error("0G treasury wallet is not configured.");
  }
  await ensureZeroGMainnet();
  const txHash = await window.ethereum!.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: ZERO_G_TREASURY_WALLET,
        value: decimalToWeiHex(amount0G),
      },
    ],
  });
  return String(txHash);
}
