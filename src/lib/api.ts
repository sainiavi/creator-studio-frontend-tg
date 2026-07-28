import axios from "axios";
import { getAccessToken, getIdentityToken } from "@privy-io/react-auth";
import { getCurrentUserId, getIdentityAliases, getWalletAddress } from "./identity";

const rawBaseUrl = import.meta.env.VITE_API_URL ?? "";
const baseURL = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

export const api = axios.create({
  baseURL,
  timeout: 12000,
  withCredentials: true,
});

// --- JWT plumbing -----------------------------------------------------------
// Write endpoints require a Bearer token backed by a verified Privy session.
// Privy token fetches are expensive (rate-limited) — cache aggressively.

const TOKEN_KEY = "kult-auth-token";
const TOKEN_USER_KEY = "kult-auth-token-user";
const TOKEN_EVM_WALLET_KEY = "kult-auth-token-evm-wallet";
const PRIVY_FETCH_COOLDOWN_MS = 60_000;

let tokenPromise: Promise<string | null> | null = null;
let privyFetchBlockedUntil = 0;

export function storeAuthToken(
  token: string,
  userId?: string | null,
  evmWalletAddress?: string | null,
) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    // Prefer stable Privy DID from JWT; wallet address can change without invalidating auth.
    let identityKey = userId ?? "";
    if (!identityKey) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
        identityKey = String(payload?.privyUserId ?? payload?.userId ?? getCurrentUserId() ?? "");
      } catch {
        identityKey = getCurrentUserId() ?? "";
      }
    }
    if (identityKey) localStorage.setItem(TOKEN_USER_KEY, identityKey);
    if (evmWalletAddress) {
      localStorage.setItem(TOKEN_EVM_WALLET_KEY, evmWalletAddress.toLowerCase());
    }
  } catch {
    // localStorage unavailable — ignore
  }
}

export function getTokenEvmWallet(): string | null {
  try {
    const cached = localStorage.getItem(TOKEN_EVM_WALLET_KEY);
    if (cached) return cached;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    const wallet = payload?.evmWalletAddress;
    return typeof wallet === "string" && wallet ? wallet.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_USER_KEY);
    localStorage.removeItem(TOKEN_EVM_WALLET_KEY);
  } catch {
    // localStorage unavailable — ignore
  }
  tokenPromise = null;
}

/** Warm the auth token cache after login — skips Privy if JWT is already valid. */
export function prefetchAuthToken(force = false): Promise<string | null> {
  if (!force && hasUsableCachedToken()) {
    return Promise.resolve(localStorage.getItem(TOKEN_KEY));
  }
  return getToken(force);
}

function currentIdentity(): string {
  return getCurrentUserId() ?? "";
}

function normalizeIdentity(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return /^0x[a-fA-F0-9]{40}$/.test(raw) ? raw.toLowerCase() : raw;
}

function hasUsableCachedToken(): boolean {
  const cached = localStorage.getItem(TOKEN_KEY);
  if (!cached) return false;

  const aliases = new Set(getIdentityAliases().map(normalizeIdentity).filter(Boolean));
  const tokenUser = normalizeIdentity(localStorage.getItem(TOKEN_USER_KEY));
  if (tokenUser && aliases.has(tokenUser)) return true;

  const tokenWallet = getTokenEvmWallet();
  const connectedWallet = normalizeIdentity(getWalletAddress());
  if (tokenWallet && connectedWallet && tokenWallet === connectedWallet) return true;

  return false;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

async function requestAuthToken(body: Record<string, unknown>) {
  const response = await axios.post(`${baseURL}/auth/token`, body, {
    timeout: 10000,
    withCredentials: true,
  });
  return response.data ?? null;
}

async function fetchTokenFromPrivy(): Promise<string | null> {
  if (Date.now() < privyFetchBlockedUntil) {
    return localStorage.getItem(TOKEN_KEY);
  }

  try {
    const userId = currentIdentity();
    if (!userId) return null;

    const [privyAccessToken, privyIdentityToken] = await Promise.all([
      withTimeout(getAccessToken(), 4000),
      withTimeout(getIdentityToken(), 4000),
    ]);

    const privyBody: Record<string, string> = {};
    if (typeof privyAccessToken === "string" && privyAccessToken.trim()) {
      privyBody.privyAccessToken = privyAccessToken.trim();
    }
    if (typeof privyIdentityToken === "string" && privyIdentityToken.trim()) {
      privyBody.privyIdentityToken = privyIdentityToken.trim();
    }

    if (Object.keys(privyBody).length === 0) return null;

    const authResponse = await requestAuthToken(privyBody).catch(() => null);
    const token = authResponse?.token ?? null;

    if (token) {
      storeAuthToken(
        token,
        authResponse?.privyUserId ?? authResponse?.userId ?? userId,
        authResponse?.evmWalletAddress ?? null,
      );
      privyFetchBlockedUntil = 0;
    }

    return token;
  } catch {
    privyFetchBlockedUntil = Date.now() + PRIVY_FETCH_COOLDOWN_MS;
    return localStorage.getItem(TOKEN_KEY);
  }
}

function getToken(force = false): Promise<string | null> {
  if (!force && hasUsableCachedToken()) {
    return Promise.resolve(localStorage.getItem(TOKEN_KEY));
  }

  if (!tokenPromise) {
    tokenPromise = fetchTokenFromPrivy().finally(() => {
      tokenPromise = null;
    });
  }
  return tokenPromise;
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (error.response?.status === 401 && config && !config.__retriedAuth) {
      if (Date.now() < privyFetchBlockedUntil) {
        return Promise.reject(error);
      }
      clearAuthToken();
      const token = await getToken(true);
      if (token) {
        config.__retriedAuth = true;
        config.headers.Authorization = `Bearer ${token}`;
        return api.request(config);
      }
    }
    return Promise.reject(error);
  },
);
