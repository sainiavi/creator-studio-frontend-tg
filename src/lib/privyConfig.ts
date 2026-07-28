import type { PrivyClientConfig } from "@privy-io/react-auth";

import { zeroGMainnet } from "./zeroGChain";
import { ZERO_G_WALLET_LIST } from "./zeroGWalletList";

export const VITE_PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";
export const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID || undefined;
export const PRIVY_APP_NAME = import.meta.env.VITE_APP_NAME ?? "KULT Creator Studio";

export const privyConfig: PrivyClientConfig = {
  // Browser: Google/email OTP, external EVM wallets, or Telegram in the mini-app.
  // Every browser-authenticated account receives an Ethereum embedded wallet
  // (also used as the 0G-chain wallet for payments/subscriptions).
  loginMethods: ["telegram", "google", "email", "wallet"],
  defaultChain: zeroGMainnet,
  supportedChains: [zeroGMainnet],
  embeddedWallets: {
    ethereum: {
      // "all-users" also provisions an EVM wallet for existing accounts that
      // previously received only a TON wallet.
      createOnLogin: "all-users",
    },
  },
  appearance: {
    theme: "dark",
    accentColor: "#A855F7",
    landingHeader: "Sign in to KULT Creator",
    loginMessage:
      "Sign in with Google, email, or connect Bitget, OKX, MetaMask, and other 0G-compatible wallets.",
    showWalletLoginFirst: false,
    walletChainType: "ethereum-only",
    walletList: ZERO_G_WALLET_LIST,
  },
};
