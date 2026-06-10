import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL ?? "";
const baseURL = rawBaseUrl.replace(/\/$/, "").endsWith("/api")
  ? rawBaseUrl.replace(/\/$/, "")
  : `${rawBaseUrl.replace(/\/$/, "")}/api`;

export const api = axios.create({
  baseURL,
  timeout: 12000
});

// --- JWT plumbing -----------------------------------------------------------
// Write endpoints require a Bearer token. We fetch an anonymous token once,
// cache it, and attach it to every request. 401s clear the cache and retry
// once with a fresh token.

const TOKEN_KEY = "kult-auth-token";
let tokenPromise: Promise<string | null> | null = null;

async function fetchToken(): Promise<string | null> {
  try {
    const userId = localStorage.getItem("kult_anon_uid") ?? undefined;
    // Plain axios: must not run through the interceptor that awaits the token.
    const response = await axios.post(`${baseURL}/auth/token`, { userId }, { timeout: 10000 });
    const token: string | null = response.data?.token ?? null;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return null; // backend offline or auth unconfigured — requests go out unauthenticated
  }
}

function getToken(): Promise<string | null> {
  const cached = localStorage.getItem(TOKEN_KEY);
  if (cached) return Promise.resolve(cached);
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
      localStorage.removeItem(TOKEN_KEY);
      const token = await getToken();
      if (token) {
        config.__retriedAuth = true;
        config.headers.Authorization = `Bearer ${token}`;
        return api.request(config);
      }
    }
    return Promise.reject(error);
  }
);
