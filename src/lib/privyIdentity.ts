import type { ConnectedWallet, User, Wallet } from "@privy-io/react-auth";
import { clearPrivyIdentity, setPrivyIdentity } from "./identity";

type TelegramAccount = {
  type: "telegram";
  telegramUserId?: string;
  telegram_user_id?: string;
  username?: string | null;
  firstName?: string | null;
  first_name?: string | null;
};

type WalletAccount = Wallet & {
  type?: "wallet";
};

function isWallet(account: User["linkedAccounts"][number]): account is WalletAccount {
  return account.type === "wallet" && typeof account.address === "string";
}

function isTelegram(account: User["linkedAccounts"][number]): account is TelegramAccount {
  return account.type === "telegram";
}

function isEvmAddress(address?: string | null): boolean {
  return Boolean(address && /^0x[a-fA-F0-9]{40}$/.test(address.trim()));
}

function findEvmWallet(user: User, connectedWallets: ConnectedWallet[] = []): Wallet | null {
  const linked = user.linkedAccounts.filter(isWallet);
  const byChain = linked.find(
    (wallet) => wallet.chainType === "ethereum" && isEvmAddress(wallet.address),
  );
  if (byChain) return byChain;

  const byAddress = linked.find((wallet) => isEvmAddress(wallet.address));
  if (byAddress) return byAddress;

  const connected = connectedWallets.find(
    (wallet) => wallet.type === "ethereum" && isEvmAddress(wallet.address),
  );
  if (connected) {
    return {
      type: "wallet",
      chainType: "ethereum",
      address: connected.address,
    } as Wallet;
  }

  if (user.wallet && isEvmAddress(user.wallet.address)) {
    return user.wallet;
  }

  return null;
}

function preferredWallet(user: User, chainType?: string): Wallet | null {
  const wallets = user.linkedAccounts.filter(isWallet);
  if (chainType) {
    return wallets.find((wallet) => wallet.chainType === chainType) ?? null;
  }
  return wallets[0] ?? user.wallet ?? null;
}

function telegramAccount(user: User): TelegramAccount | null {
  return user.linkedAccounts.find(isTelegram) ?? user.telegram ?? null;
}

export function getPrivyIdentity(user: User | null, connectedWallets: ConnectedWallet[] = []) {
  if (!user) return null;

  const tonWallet = preferredWallet(user, "ton");
  const evmWallet = findEvmWallet(user, connectedWallets);
  const telegram = telegramAccount(user);
  const telegramUserId = telegram?.telegramUserId ?? telegram?.telegram_user_id ?? null;
  const telegramUsername = telegram?.username ?? null;
  const telegramName = telegram?.firstName ?? telegram?.first_name ?? null;

  return {
    // The verified EVM/0G wallet is the public product identity. Privy's DID
    // remains available in the signed auth token as an ownership alias.
    userId: evmWallet?.address ?? user.id,
    privyUserId: user.id,
    walletAddress: evmWallet?.address && isEvmAddress(evmWallet.address) ? evmWallet.address : null,
    tonWalletAddress: tonWallet?.chainType === "ton" ? tonWallet.address : null,
    telegramUserId,
    username: telegramUsername ? `@${telegramUsername}` : (telegramName ?? null),
  };
}

export function syncPrivyIdentity(user: User | null, connectedWallets: ConnectedWallet[] = []) {
  const identity = getPrivyIdentity(user, connectedWallets);
  if (!identity) {
    clearPrivyIdentity();
    return;
  }
  setPrivyIdentity(identity);
}

/** Sync linked + connected Privy wallets into local identity storage. */
export function syncSessionWalletIdentity(
  user: User | null,
  connectedWallets: ConnectedWallet[] = [],
) {
  syncPrivyIdentity(user, connectedWallets);
  return getPrivyIdentity(user, connectedWallets)?.walletAddress ?? null;
}

export function getEvmWallet(
  user: User | null,
  connectedWallets: ConnectedWallet[] = [],
): Wallet | null {
  if (!user) return null;
  return findEvmWallet(user, connectedWallets);
}

export function hasEvmWallet(
  user: User | null,
  connectedWallets: ConnectedWallet[] = [],
): boolean {
  return Boolean(getEvmWallet(user, connectedWallets));
}

export function hasTonWallet(user: User | null): boolean {
  return Boolean(user && preferredWallet(user, "ton"));
}

export function hasTelegramAccount(user: User | null): boolean {
  return Boolean(user && telegramAccount(user));
}
