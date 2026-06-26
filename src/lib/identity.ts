// Single source of truth for "who is the current user".
//
// Telegram Mini App users authenticate through Privy. When Privy is available,
// its stable user id owns creator data; TON/EVM addresses are display and
// payment identities. Development fallback: a stable per-browser anonymous id.

const WALLET_KEYS = ["kult_wallet", "walletAddress", "wallet_address", "kult_wallet_address"];
const TON_WALLET_KEY = "kult_ton_wallet";
const PRIVY_USER_ID_KEY = "kult_privy_user_id";
const TELEGRAM_USERNAME_KEY = "kult_telegram_username";
const ANON_ID_KEY = "kult_anon_uid";
const ANON_NAME_KEY = "kult_anon_username";

export type CreatorIdentity = {
  privyUserId?: string | null;
  telegramUsername?: string | null;
  tonAddress?: string | null;
  evmAddress?: string | null;
};

export function getWalletAddress(): string | null {
  for (const key of WALLET_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value && /^0x[a-fA-F0-9]{40}$/.test(value.trim())) {
        // normalized: addresses compare case-insensitively
        return value.trim().toLowerCase();
      }
    } catch {
      // localStorage unavailable (SSR) — fall through
    }
  }
  return null;
}

export function getTonWalletAddress(): string | null {
  try {
    return localStorage.getItem(TON_WALLET_KEY);
  } catch {
    return null;
  }
}

export function getPrivyUserId(): string | null {
  try {
    return localStorage.getItem(PRIVY_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function getTelegramUsername(): string | null {
  try {
    return localStorage.getItem(TELEGRAM_USERNAME_KEY);
  } catch {
    return null;
  }
}

export function syncCreatorIdentity(identity: CreatorIdentity) {
  try {
    if (identity.privyUserId) localStorage.setItem(PRIVY_USER_ID_KEY, identity.privyUserId);
    if (identity.telegramUsername) localStorage.setItem(TELEGRAM_USERNAME_KEY, identity.telegramUsername);
    if (identity.tonAddress) localStorage.setItem(TON_WALLET_KEY, identity.tonAddress);
    if (identity.evmAddress) localStorage.setItem("kult_wallet", identity.evmAddress.toLowerCase());
    window.dispatchEvent(new Event("kult-identity-changed"));
  } catch {
    // localStorage may be unavailable in embedded/private contexts.
  }
}

export function clearCreatorIdentity() {
  try {
    localStorage.removeItem(PRIVY_USER_ID_KEY);
    localStorage.removeItem(TELEGRAM_USERNAME_KEY);
    localStorage.removeItem(TON_WALLET_KEY);
    localStorage.removeItem("kult-auth-token");
    localStorage.removeItem("kult-auth-token-user");
    window.dispatchEvent(new Event("kult-identity-changed"));
  } catch {
    // localStorage may be unavailable in embedded/private contexts.
  }
}

function getAnonymousId(): string {
  let uid = localStorage.getItem(ANON_ID_KEY);
  if (!uid) {
    uid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANON_ID_KEY, uid);
  }
  return uid;
}

/** The current user id: Privy id when authenticated, legacy wallet/anon otherwise. */
export function getCurrentUserId(): string {
  return getPrivyUserId() ?? getWalletAddress() ?? getTonWalletAddress() ?? getAnonymousId();
}

/** Display name: Telegram handle, shortened wallet, or the generated anon name. */
export function getCurrentUsername(): string {
  const telegram = getTelegramUsername();
  if (telegram) return telegram.startsWith("@") ? telegram : `@${telegram}`;

  const ton = getTonWalletAddress();
  if (ton) return `${ton.slice(0, 4)}…${ton.slice(-4)}`;

  const wallet = getWalletAddress();
  if (wallet) return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;

  let name = localStorage.getItem(ANON_NAME_KEY);
  if (!name) {
    const adjectives = ["Swift", "Neon", "Pixel", "Cosmic", "Turbo", "Hyper", "Retro", "Glitch"];
    const nouns = ["Fox", "Owl", "Hawk", "Wolf", "Cat", "Panda", "Tiger", "Bear"];
    name =
      adjectives[Math.floor(Math.random() * adjectives.length)] +
      nouns[Math.floor(Math.random() * nouns.length)] +
      Math.floor(Math.random() * 999);
    localStorage.setItem(ANON_NAME_KEY, name);
  }
  return name;
}

/** True when `creatorId` belongs to the current user (or is unset/legacy). */
export function ownsGame(creatorId: string | null | undefined): boolean {
  if (!creatorId) return true; // legacy games without attribution
  return creatorId === getCurrentUserId();
}
