import { BrowserProvider, getAddress, type Eip1193Provider } from "ethers";

import { api, getTokenEvmWallet, storeAuthToken } from "./api";
import { getCurrentUserId, getWalletAddress, setPrivyIdentity } from "./identity";
import { ZERO_G_CHAIN_ID } from "./zeroGChain";

const WALLET_LINK_SESSION_KEY = "kult-wallet-link-verified";

let linkInFlight: Promise<string> | null = null;
let linkInFlightAddress: string | null = null;

async function ensureZeroGChain(provider: Eip1193Provider) {
  const chainId = `0x${ZERO_G_CHAIN_ID.toString(16)}`;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (error: unknown) {
    if (typeof error !== "object" || error === null || !("code" in error) || error.code !== 4902) {
      throw error;
    }
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          chainName: "0G Mainnet",
          nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
          rpcUrls: ["https://evmrpc.0g.ai"],
          blockExplorerUrls: ["https://chainscan.0g.ai"],
        },
      ],
    });
  }
}

function normalizeAddress(address: string) {
  return getAddress(address);
}

function readLinkedSessionAddress(): string | null {
  try {
    const value = sessionStorage.getItem(WALLET_LINK_SESSION_KEY);
    return value ? normalizeAddress(value) : null;
  } catch {
    return null;
  }
}

function markWalletLinked(address: string) {
  try {
    sessionStorage.setItem(WALLET_LINK_SESSION_KEY, normalizeAddress(address).toLowerCase());
  } catch {
    // sessionStorage unavailable — ignore
  }
}

export function clearWalletLinkSession() {
  linkInFlight = null;
  linkInFlightAddress = null;
  try {
    sessionStorage.removeItem(WALLET_LINK_SESSION_KEY);
  } catch {
    // sessionStorage unavailable — ignore
  }
}

export function isWalletLinkedOnSession(address: string | null | undefined): boolean {
  if (!address) return false;
  try {
    const normalized = normalizeAddress(address);
    const sessionLinked = readLinkedSessionAddress();
    if (sessionLinked && sessionLinked === normalized) return true;
    const tokenWallet = getTokenEvmWallet();
    if (!tokenWallet) return false;
    return normalizeAddress(tokenWallet) === normalized;
  } catch {
    return false;
  }
}

/** Connect wallet → sign once on 0G → attach wallet to the current Privy session JWT. */
export async function linkWalletOnZeroG(
  address: string,
  getEthereumProvider: () => Promise<Eip1193Provider>,
) {
  const normalizedAddress = normalizeAddress(address);
  const { data: challenge } = await api.post("/auth/wallet/challenge", {
    address: normalizedAddress,
  });

  const provider = await getEthereumProvider();
  await ensureZeroGChain(provider);

  const signer = await new BrowserProvider(provider).getSigner();
  const signerAddress = normalizeAddress(await signer.getAddress());
  if (signerAddress !== normalizedAddress) {
    throw new Error("Switch to the connected Creator Studio wallet before signing.");
  }

  const signature = await signer.signMessage(challenge.message);
  const { data } = await api.post("/auth/wallet/link", {
    address: normalizedAddress,
    message: challenge.message,
    signature,
  });

  storeAuthToken(
    data.token,
    data.userId ?? getCurrentUserId(),
    data.evmWalletAddress ?? normalizedAddress,
  );
  setPrivyIdentity({
    userId: data.userId ?? normalizedAddress,
    walletAddress: data.evmWalletAddress ?? normalizedAddress,
  });
  markWalletLinked(normalizedAddress);

  return data;
}

export async function ensureWalletLinkedOnZeroG(
  address: string | null | undefined,
  getEthereumProvider: () => Promise<Eip1193Provider>,
) {
  const linkedAddress = address ?? getWalletAddress();
  if (!linkedAddress) return null;

  const normalizedAddress = normalizeAddress(linkedAddress);
  if (isWalletLinkedOnSession(normalizedAddress)) {
    return normalizedAddress;
  }

  if (linkInFlight && linkInFlightAddress === normalizedAddress) {
    return linkInFlight;
  }

  linkInFlightAddress = normalizedAddress;
  linkInFlight = linkWalletOnZeroG(normalizedAddress, getEthereumProvider)
    .then(() => normalizedAddress)
    .finally(() => {
      linkInFlight = null;
      linkInFlightAddress = null;
    });

  return linkInFlight;
}
