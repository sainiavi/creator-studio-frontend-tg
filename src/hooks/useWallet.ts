import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kult-wallet";
const SIGNATURE_KEY = "kult-wallet-sig";
const GAMES_KEY = "kult-created-games";

// 0G Mainnet configuration
const OG_CHAIN = {
  chainId: "0x4105",          // 16661 in hex
  chainName: "0G Mainnet",
  nativeCurrency: {
    name: "0G",
    symbol: "0G",
    decimals: 18
  },
  rpcUrls: ["https://evmrpc.0g.ai"],
  blockExplorerUrls: ["https://chainscan.0g.ai"]
};

const OG_CHAIN_ID = OG_CHAIN.chainId; // "0x4105"

function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function loadGames() {
  try {
    return JSON.parse(localStorage.getItem(GAMES_KEY)) ?? [];
  } catch {
    return [];
  }
}

function buildSignMessage(address) {
  const timestamp = new Date().toISOString();
  return `Welcome to Kult Creator Studio!\n\nSign this message to verify your wallet ownership.\n\nWallet: ${address}\nTimestamp: ${timestamp}\nChain: 0G Mainnet`;
}

export function useWallet() {
  const [address, setAddress] = useState(() => localStorage.getItem(STORAGE_KEY) ?? null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState(() => localStorage.getItem(SIGNATURE_KEY) ?? null);
  const [createdGames, setCreatedGames] = useState(loadGames);

  const isConnected = Boolean(address) && Boolean(signature);
  const isOnOGChain = chainId?.toLowerCase() === OG_CHAIN_ID.toLowerCase();

  // Sync account/chain changes from MetaMask
  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;

    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        // User disconnected from MetaMask
        setAddress(null);
        setSignature(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SIGNATURE_KEY);
      } else if (accounts[0] !== address) {
        // Switched accounts — require re-sign
        setAddress(null);
        setSignature(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SIGNATURE_KEY);
      }
    }

    function handleChainChanged(chain) {
      setChainId(chain);
    }

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    // Get current chain on mount
    eth.request({ method: "eth_chainId" }).then(setChainId).catch(() => {});

    // Verify stored session is still valid
    if (address) {
      eth.request({ method: "eth_accounts" }).then(accounts => {
        if (accounts.length === 0 || accounts[0].toLowerCase() !== address.toLowerCase()) {
          setAddress(null);
          setSignature(null);
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(SIGNATURE_KEY);
        }
      }).catch(() => {});
    }

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [address]);

  /**
   * Switch MetaMask to 0G Mainnet.
   * If the network isn't added yet, it will prompt the user to add it.
   */
  const switchToOGChain = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return false;

    setIsSwitchingChain(true);
    setError(null);

    try {
      // Try switching to the chain
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: OG_CHAIN_ID }]
      });
      setChainId(OG_CHAIN_ID);
      return true;
    } catch (switchError) {
      // 4902 = chain not added to MetaMask yet
      if (switchError.code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [OG_CHAIN]
          });
          setChainId(OG_CHAIN_ID);
          return true;
        } catch (addError) {
          setError("Failed to add 0G Mainnet. Please add it manually.");
          return false;
        }
      } else if (switchError.code === 4001) {
        setError("Please switch to 0G Mainnet to continue.");
        return false;
      } else {
        setError(switchError.message ?? "Failed to switch network.");
        return false;
      }
    } finally {
      setIsSwitchingChain(false);
    }
  }, []);

  /**
   * Full connect flow:
   * 1. Request accounts from MetaMask
   * 2. Switch to 0G Mainnet
   * 3. Sign a verification message
   */
  const connect = useCallback(async () => {
    setError(null);

    if (typeof window.ethereum === "undefined") {
      setError("MetaMask is not installed. Please install it to continue.");
      window.open("https://metamask.io/download/", "_blank");
      return null;
    }

    setIsConnecting(true);

    try {
      // Step 1: Request wallet accounts
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const walletAddress = accounts[0];

      // Step 2: Switch to 0G Mainnet
      const switched = await switchToOGChain();
      if (!switched) {
        setIsConnecting(false);
        return null;
      }

      // Step 3: Sign a message to prove ownership
      const message = buildSignMessage(walletAddress);
      const sig = await window.ethereum.request({
        method: "personal_sign",
        params: [message, walletAddress]
      });

      // All steps passed — save session
      setAddress(walletAddress);
      setSignature(sig);
      localStorage.setItem(STORAGE_KEY, walletAddress);
      localStorage.setItem(SIGNATURE_KEY, sig);

      return walletAddress;
    } catch (err) {
      if (err.code === 4001) {
        setError("Request rejected. Please approve the sign-in message to continue.");
      } else {
        setError(err.message ?? "Failed to connect wallet.");
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [switchToOGChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setSignature(null);
    setChainId(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SIGNATURE_KEY);
  }, []);

  const addCreatedGame = useCallback((gamePackage) => {
    if (!gamePackage) return;
    const game = {
      id: gamePackage.id ?? `game-${Date.now()}`,
      title: gamePackage.title ?? "Untitled Game",
      templateId: gamePackage.templateId,
      category: gamePackage.category ?? "Game",
      thumbnailUrl: gamePackage.thumbnailUrl ?? "/thumbnails/simple-agent-game-cover.png",
      createdAt: new Date().toISOString(),
      wallet: address
    };
    setCreatedGames(prev => {
      const next = [game, ...prev].slice(0, 50);
      localStorage.setItem(GAMES_KEY, JSON.stringify(next));
      return next;
    });
  }, [address]);

  const clearGames = useCallback(() => {
    setCreatedGames([]);
    localStorage.removeItem(GAMES_KEY);
  }, []);

  return {
    address,
    shortAddress: shortenAddress(address),
    chainId,
    chainName: OG_CHAIN.chainName,
    isConnected,
    isConnecting,
    isSwitchingChain,
    isOnOGChain,
    error,
    signature,
    connect,
    disconnect,
    switchToOGChain,
    createdGames,
    addCreatedGame,
    clearGames
  };
}
