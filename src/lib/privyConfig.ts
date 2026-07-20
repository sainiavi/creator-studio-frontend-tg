import type { PrivyClientConfig } from "@privy-io/react-auth";

export const VITE_PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";
export const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID || undefined;
export const PRIVY_APP_NAME = import.meta.env.VITE_APP_NAME ?? "KULT Creator Studio";

export const privyConfig: PrivyClientConfig = {
  // Telegram for mini app. Email for web → Privy then creates an embedded TON wallet.
  // There is no Privy login button named "TON Wallet" — TON is not a login method.
  loginMethods: ["telegram", "email"],
  appearance: {
    theme: "dark",
    accentColor: "#0098EA",
    landingHeader: "Connect TON Wallet",
    loginMessage: "Enter your email. Privy will create your TON wallet after you verify.",
    showWalletLoginFirst: false,
  },
};
