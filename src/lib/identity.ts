// Single source of truth for "who is the current user".
//
// Only identities established by the real authentication flow are accepted.
// Anonymous browser-generated users must never be treated as signed-in users.

const PRIVY_USER_KEY = "kult_privy_user_id";
const PRIVY_WALLET_KEY = "kult_privy_wallet";
const PRIVY_TON_WALLET_KEY = "kult_privy_ton_wallet";
const PRIVY_TELEGRAM_KEY = "kult_privy_telegram_user";
const PRIVY_NAME_KEY = "kult_privy_username";
const WALLET_KEYS = [
  PRIVY_WALLET_KEY,
  "kult_wallet",
  "walletAddress",
  "wallet_address",
  "kult_wallet_address",
];

function readStorage(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null | undefined) {
  try {
    if (value?.trim()) {
      localStorage.setItem(key, value.trim());
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage unavailable — ignore
  }
}

export function setPrivyIdentity(identity: {
  userId: string;
  walletAddress?: string | null;
  tonWalletAddress?: string | null;
  telegramUserId?: string | null;
  username?: string | null;
}) {
  writeStorage(PRIVY_USER_KEY, identity.userId);
  writeStorage(PRIVY_WALLET_KEY, identity.walletAddress);
  writeStorage(PRIVY_TON_WALLET_KEY, identity.tonWalletAddress);
  writeStorage(PRIVY_TELEGRAM_KEY, identity.telegramUserId);
  writeStorage(PRIVY_NAME_KEY, identity.username);
}

export function clearPrivyIdentity() {
  writeStorage(PRIVY_USER_KEY, null);
  writeStorage(PRIVY_WALLET_KEY, null);
  writeStorage(PRIVY_TON_WALLET_KEY, null);
  writeStorage(PRIVY_TELEGRAM_KEY, null);
  writeStorage(PRIVY_NAME_KEY, null);
}

/** Remove identities created by the retired anonymous-user flow. */
export function clearLegacyAnonymousIdentity() {
  try {
    localStorage.removeItem("kult_anon_uid");
    localStorage.removeItem("kult_anon_username");
  } catch {
    // localStorage unavailable — ignore
  }
}

export function getWalletAddress(): string | null {
  for (const key of WALLET_KEYS) {
    const value = readStorage(key);
    if (value) {
      if (/^0x[a-fA-F0-9]{40}$/.test(value.trim())) {
        // normalized: addresses compare case-insensitively
        return value.trim().toLowerCase();
      }
    }
  }
  return null;
}

export function getTonWalletAddress(): string | null {
  return readStorage(PRIVY_TON_WALLET_KEY);
}

function getTelegramUserId(): string | null {
  const telegramUserId = readStorage(PRIVY_TELEGRAM_KEY);
  return telegramUserId ? `tg_${telegramUserId}` : null;
}

/** Returns the authenticated user's id, or an empty value for public visitors. */
export function getCurrentUserId(): string {
  const userId =
    readStorage(PRIVY_USER_KEY) ??
    getTonWalletAddress() ??
    getWalletAddress() ??
    getTelegramUserId();

  return userId ?? "";
}

/** Display name for the authenticated identity. */
export function getCurrentUsername(): string {
  const privyName = readStorage(PRIVY_NAME_KEY);
  if (privyName) return privyName;

  const tonWallet = getTonWalletAddress();
  if (tonWallet) return `${tonWallet.slice(0, 6)}...${tonWallet.slice(-4)}`;

  const wallet = getWalletAddress();
  if (wallet) return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  return "KULT Player";
}

export function setCurrentUsername(name: string): string {
  const cleanName = name.trim().slice(0, 32);
  if (!cleanName) return getCurrentUsername();
  writeStorage(PRIVY_NAME_KEY, cleanName);
  return cleanName;
}

/** True when `creatorId` belongs to the current user (or is unset/legacy). */
export function ownsGame(creatorId: string | null | undefined): boolean {
  if (!creatorId) return true; // legacy games without attribution
  return [
    getCurrentUserId(),
    readStorage(PRIVY_USER_KEY),
    getTonWalletAddress(),
    getWalletAddress(),
    getTelegramUserId(),
  ].includes(creatorId);
}
