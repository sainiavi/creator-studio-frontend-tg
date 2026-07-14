// Single source of truth for "who is the current user".
//
// Production: the connected wallet address (set in localStorage by the wallet
// connect flow) IS the user — a different wallet address is a different user.
// Development fallback: a stable per-browser anonymous id.

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
const ANON_ID_KEY = "kult_anon_uid";
const ANON_NAME_KEY = "kult_anon_username";

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

function getAnonymousId(): string {
  let uid = localStorage.getItem(ANON_ID_KEY);
  if (!uid) {
    uid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANON_ID_KEY, uid);
  }
  return uid;
}

/** The current user id: wallet address when connected, anonymous id otherwise. */
export function getCurrentUserId(): string {
  return (
    getTonWalletAddress() ??
    getWalletAddress() ??
    getTelegramUserId() ??
    readStorage(PRIVY_USER_KEY) ??
    getAnonymousId()
  );
}

/** Display name: shortened wallet (0x1234…abcd) or the generated anon name. */
export function getCurrentUsername(): string {
  const privyName = readStorage(PRIVY_NAME_KEY);
  if (privyName) return privyName;

  const savedName = localStorage.getItem(ANON_NAME_KEY);
  if (savedName?.trim()) return savedName.trim();

  const tonWallet = getTonWalletAddress();
  if (tonWallet) return `${tonWallet.slice(0, 6)}...${tonWallet.slice(-4)}`;

  const wallet = getWalletAddress();
  if (wallet) return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  const adjectives = ["Swift", "Neon", "Pixel", "Cosmic", "Turbo", "Hyper", "Retro", "Glitch"];
  const nouns = ["Fox", "Owl", "Hawk", "Wolf", "Cat", "Panda", "Tiger", "Bear"];
  const name =
    adjectives[Math.floor(Math.random() * adjectives.length)] +
    nouns[Math.floor(Math.random() * nouns.length)] +
    Math.floor(Math.random() * 999);
  localStorage.setItem(ANON_NAME_KEY, name);
  return name;
}

export function setCurrentUsername(name: string): string {
  const cleanName = name.trim().slice(0, 32);
  if (!cleanName) return getCurrentUsername();
  localStorage.setItem(ANON_NAME_KEY, cleanName);
  return cleanName;
}

/** True when `creatorId` belongs to the current user (or is unset/legacy). */
export function ownsGame(creatorId: string | null | undefined): boolean {
  if (!creatorId) return true; // legacy games without attribution
  return creatorId === getCurrentUserId();
}
