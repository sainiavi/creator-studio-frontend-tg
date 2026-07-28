import type { WalletListEntry } from "@privy-io/react-auth";

/**
 * EVM wallets shown in Privy connect/login modals for 0G Mainnet.
 * Order matters: Bitget + OKX first, then widely used exchange/browser wallets,
 * then any detected extension, then the full WalletConnect registry.
 */
export const ZERO_G_WALLET_LIST: WalletListEntry[] = [
  "bitget_wallet",
  "okx_wallet",
  "metamask",
  "coinbase_wallet",
  "binance",
  "bybit_wallet",
  "kraken_wallet",
  "cryptocom",
  "uniswap",
  "rainbow",
  "zerion",
  "safe",
  "base_account",
  "robinhood_wallet",
  "universal_profile",
  "detected_ethereum_wallets",
  "wallet_connect",
];

export const ZERO_G_CONNECT_WALLET_OPTIONS = {
  description: "Connect a wallet that supports EVM chains (0G Mainnet)",
  walletList: ZERO_G_WALLET_LIST,
  walletChainType: "ethereum-only" as const,
};
