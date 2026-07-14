import type { PrivyClientConfig } from "@privy-io/react-auth";

export const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";
export const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID || undefined;
export const PRIVY_APP_NAME = import.meta.env.VITE_APP_NAME ?? "KULT Creator Studio";

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["telegram", "wallet", "email"],
  appearance: {
    theme: "dark",
    accentColor: "#a855f7",
    landingHeader: "Sign in to KULT",
    loginMessage: "Use Telegram or a wallet to enter Creator Studio.",
    showWalletLoginFirst: false,
    walletChainType: "ethereum-only",
  },
};
