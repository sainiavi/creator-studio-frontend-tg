import type { PrivyClientConfig } from "@privy-io/react-auth";

export const VITE_PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID ?? "";
export const PRIVY_CLIENT_ID = import.meta.env.VITE_PRIVY_CLIENT_ID || undefined;
export const PRIVY_APP_NAME = import.meta.env.VITE_APP_NAME ?? "KULT Creator Studio";

export const privyConfig: PrivyClientConfig = {
  // Browser authentication is email OTP. Every authenticated account receives
  // an Ethereum embedded wallet, which is also its 0G-chain wallet.
  loginMethods: ["telegram", "email"],
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
    loginMessage: "Enter your email. Your secure 0G wallet is created after verification.",
    showWalletLoginFirst: false,
  },
};
