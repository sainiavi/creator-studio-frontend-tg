import type { User, Wallet } from "@privy-io/react-auth";
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

function preferredWallet(user: User, chainType?: string): Wallet | null {
  const wallets = user.linkedAccounts.filter(isWallet);
  return (
    wallets.find((wallet) => wallet.chainType === chainType) ?? wallets[0] ?? user.wallet ?? null
  );
}

function telegramAccount(user: User): TelegramAccount | null {
  return user.linkedAccounts.find(isTelegram) ?? user.telegram ?? null;
}

export function getPrivyIdentity(user: User | null) {
  if (!user) return null;

  const tonWallet = preferredWallet(user, "ton");
  const wallet = preferredWallet(user);
  const telegram = telegramAccount(user);
  const telegramUserId = telegram?.telegramUserId ?? telegram?.telegram_user_id ?? null;
  const telegramUsername = telegram?.username ?? null;
  const telegramName = telegram?.firstName ?? telegram?.first_name ?? null;
  return {
    userId: user.id,
    walletAddress: wallet?.chainType === "ethereum" ? wallet.address : null,
    tonWalletAddress: tonWallet?.chainType === "ton" ? tonWallet.address : null,
    telegramUserId,
    username: telegramUsername ? `@${telegramUsername}` : (telegramName ?? null),
  };
}

export function syncPrivyIdentity(user: User | null) {
  const identity = getPrivyIdentity(user);
  if (!identity) {
    clearPrivyIdentity();
    return;
  }
  setPrivyIdentity(identity);
}

export function hasTonWallet(user: User | null): boolean {
  return Boolean(user && preferredWallet(user, "ton"));
}

export function hasTelegramAccount(user: User | null): boolean {
  return Boolean(user && telegramAccount(user));
}
