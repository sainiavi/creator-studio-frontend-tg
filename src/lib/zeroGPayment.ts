import {
  humanZeroGToWeiHex,
  parseHumanZeroGAmount,
  ZERO_G_CHAIN_ID,
  ZERO_G_TREASURY_WALLET,
} from "@/lib/zeroGChain";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const ZERO_G_RPC_URL = import.meta.env.VITE_ZERO_G_MAINNET_RPC_URL || "https://evmrpc.0g.ai";

function toHexChainId(chainId: number) {
  return `0x${chainId.toString(16)}`;
}

async function ensureZeroGMainnet() {
  if (!window.ethereum) throw new Error("Connect a wallet to pay with 0G.");
  const chainIdHex = toHexChainId(ZERO_G_CHAIN_ID);
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (error: any) {
    if (error?.code !== 4902) throw error;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: "0G Mainnet",
          nativeCurrency: {
            name: "0G",
            symbol: "0G",
            decimals: 18,
          },
          rpcUrls: [ZERO_G_RPC_URL],
          blockExplorerUrls: ["https://chainscan.0g.ai"],
        },
      ],
    });
  }
}

/** Legacy path for external wallets injected via window.ethereum. Prefer usePrivyEvmWallet(). */
export async function sendZeroGGenerationPayment(amount0G: number | string) {
  const from = (await window.ethereum?.request({ method: "eth_accounts" }))?.[0];
  if (!from) throw new Error("Connect your wallet before generating a paid game.");
  if (!/^0x[a-fA-F0-9]{40}$/.test(ZERO_G_TREASURY_WALLET)) {
    throw new Error("0G treasury wallet is not configured.");
  }
  const humanAmount = parseHumanZeroGAmount(amount0G);
  await ensureZeroGMainnet();
  const txHash = await window.ethereum!.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: ZERO_G_TREASURY_WALLET,
        value: humanZeroGToWeiHex(humanAmount),
      },
    ],
  });
  return String(txHash);
}

export { humanZeroGToWeiHex as decimalToWeiHex, ZERO_G_CHAIN_ID, ZERO_G_TREASURY_WALLET };
