import type { PrivyClientConfig } from "@privy-io/react-auth";

import { zeroGMainnet } from "./zeroGChain";

export const VITE_PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";
export const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID || undefined;
export const PRIVY_APP_NAME = import.meta.env.VITE_APP_NAME ?? "KULT Creator Studio";

export const privyConfig: PrivyClientConfig = {
  // Browser: Google OAuth or email OTP. Telegram mini-app: Telegram login.
  // Every browser-authenticated account receives an Ethereum embedded wallet
  // (also used as the 0G-chain wallet for payments/subscriptions).
  loginMethods: ["telegram", "google", "email"],
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
    loginMessage: "Sign in with Google or email. Your secure 0G wallet is created after verification.",
    showWalletLoginFirst: false,
  },
};
