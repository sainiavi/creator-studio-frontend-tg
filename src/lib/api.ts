import axios from "axios";
import { getAccessToken, getIdentityToken } from "@privy-io/react-auth";
import { getCurrentUserId } from "./identity";

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
// 401s clear the cache and retry once with a fresh authenticated token.

const TOKEN_KEY = "kult-auth-token";
const TOKEN_USER_KEY = "kult-auth-token-user";
let tokenPromise: Promise<string | null> | null = null;

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_USER_KEY);
  } catch {
    // localStorage unavailable — ignore
  }
  tokenPromise = null;
}

/** Warm the auth token cache after login or identity changes. */
export function prefetchAuthToken(): Promise<string | null> {
  return getToken();
}

function currentIdentity(): string | undefined {
  try {
    return getCurrentUserId();
  } catch {
    return undefined;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

async function requestAuthToken(body: Record<string, unknown>): Promise<string | null> {
  // Plain axios: must not run through the interceptor that awaits the token.
  const response = await axios.post(`${baseURL}/auth/token`, body, {
    timeout: 10000,
    withCredentials: true,
  });
  return response.data?.token ?? null;
}

async function fetchToken(): Promise<string | null> {
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

    // A user id by itself is not proof of identity.
    if (Object.keys(privyBody).length === 0) return null;
    const token = await requestAuthToken(privyBody).catch(() => null);

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_USER_KEY, userId ?? "");
    }
    return token;
  } catch {
    return null; // backend offline or auth unconfigured — requests go out unauthenticated
  }
}

function getToken(): Promise<string | null> {
  const cached = localStorage.getItem(TOKEN_KEY);
  // A cached token only counts if it was issued for the CURRENT identity —
  // switching wallets means switching users.
  if (cached && localStorage.getItem(TOKEN_USER_KEY) === (currentIdentity() ?? "")) {
    return Promise.resolve(cached);
  }
  if (!tokenPromise) {
    tokenPromise = fetchToken().finally(() => {
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
      clearAuthToken();
      const token = await getToken();
      if (token) {
        config.__retriedAuth = true;
        config.headers.Authorization = `Bearer ${token}`;
        return api.request(config);
      }
    }
    return Promise.reject(error);
  },
);
