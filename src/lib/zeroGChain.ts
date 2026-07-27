import { defineChain } from "viem";

export const ZERO_G_CHAIN_ID = Number(import.meta.env.VITE_ZERO_G_MAINNET_CHAIN_ID || 16661);
export const ZERO_G_RPC_URL = import.meta.env.VITE_ZERO_G_MAINNET_RPC_URL || "https://evmrpc.0g.ai";
export const ZERO_G_TREASURY_WALLET = import.meta.env.VITE_ZERO_G_TREASURY_WALLET || "";
export const ZERO_G_CAIP2 = `eip155:${ZERO_G_CHAIN_ID}` as const;
/** Native token sentinel used by Privy funding/deposit flows. */
export const ZERO_G_NATIVE_ASSET = "0x0000000000000000000000000000000000000000";
export const ZERO_G_FUNDING_ENV = import.meta.env.PROD ? "production" : "sandbox";

export const zeroGMainnet = defineChain({
  id: ZERO_G_CHAIN_ID,
  name: "0G Mainnet",
  nativeCurrency: {
    name: "0G",
    symbol: "0G",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [ZERO_G_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "0G Chainscan", url: "https://chainscan.0g.ai" },
  },
});

export function getZeroGFundWalletConfig(amount = "10") {
  return {
    chain: zeroGMainnet,
    amount,
    asset: "native-currency" as const,
  };
}

export function formatZeroGAddress(address: string) {
  const trimmed = address.trim();
  if (trimmed.length <= 12) return trimmed;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

export function formatZeroGBalance(wei: bigint, maxDecimals = 4) {
  const whole = wei / 10n ** 18n;
  const fraction = wei % 10n ** 18n;
  if (fraction === 0n) return `${whole} 0G`;
  const fractionText = fraction.toString().padStart(18, "0").slice(0, maxDecimals).replace(/0+$/, "");
  return `${whole}.${fractionText} 0G`;
}

export function decimalToWeiHex(amount: number | string) {
  const [whole, fraction = ""] = String(amount).split(".");
  const fractionWei = `${fraction.slice(0, 18)}${"0".repeat(Math.max(0, 18 - fraction.length))}`;
  const wei = BigInt(whole || "0") * 10n ** 18n + BigInt(fractionWei || "0");
  return `0x${wei.toString(16)}`;
}
