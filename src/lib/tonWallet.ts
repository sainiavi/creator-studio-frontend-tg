import type { User } from "@privy-io/react-auth";

import { getTonWalletAddress } from "@/lib/identity";

export type TonWallet = {
  address: string;
  id?: string | null;
  publicKey?: string | null;
  chainType: "ton";
  type?: "wallet";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

export function toTonWallet(value: unknown): TonWallet | null {
  if (!isRecord(value) || value.chainType !== "ton" || typeof value.address !== "string") {
    return null;
  }

  return {
    address: value.address,
    id: typeof value.id === "string" || value.id === null ? value.id : undefined,
    publicKey: typeof value.publicKey === "string" ? value.publicKey : undefined,
    chainType: "ton",
    type: "wallet",
  };
}

export function getTonWallet(user: User | null | undefined): TonWallet | null {
  const wallet = user?.linkedAccounts?.find(
    (account) => isRecord(account) && account.type === "wallet" && account.chainType === "ton",
  );

  return toTonWallet(wallet);
}

export function getStoredTonWallet(): TonWallet | null {
  const address = getTonWalletAddress();
  if (!address) {
    return null;
  }

  return {
    address,
    chainType: "ton",
    type: "wallet",
  };
}

export function formatTonAddress(address: string): string {
  if (address.length <= 14) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function getTonWalletErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Privy could not create a TON wallet for this account.";
}
