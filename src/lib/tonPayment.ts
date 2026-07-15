import { Buffer } from "buffer";
import {
  Address,
  beginCell,
  internal,
  SendMode,
  toNano,
  TonClient,
  WalletContractV3R1,
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5Beta,
  WalletContractV5R1,
  type Cell,
  type Contract,
} from "@ton/ton";
import type { TonWallet } from "@/lib/tonWallet";

type SignRawHash = (input: {
  address: string;
  chainType: "ton";
  hash: `0x${string}`;
}) => Promise<{ signature: `0x${string}` }>;

const TON_MAINNET_ENDPOINT =
  import.meta.env.VITE_TON_RPC_URL || "https://toncenter.com/api/v2/jsonRPC";
const TON_TREASURY_WALLET = import.meta.env.VITE_TON_TREASURY_WALLET || "";

type SupportedWalletContract = Contract & {
  getSeqno: (provider: ReturnType<TonClient["provider"]>) => Promise<number>;
  createTransfer: (args: {
    seqno: number;
    signer: (message: Cell) => Promise<Buffer>;
    messages: ReturnType<typeof internal>[];
    sendMode: SendMode;
    timeout?: number;
    authType?: "external";
  }) => Cell | Promise<Cell>;
};

function publicKeyBuffer(publicKey: string | null | undefined) {
  if (!publicKey)
    throw new Error("TON wallet public key is missing. Reconnect the wallet and try again.");
  const value = publicKey.trim();
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  if (/^[a-fA-F0-9]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  const base64 = Buffer.from(value, "base64");
  if (base64.length === 32) return base64;
  throw new Error("TON wallet public key is invalid.");
}

function sameTonAddress(left: Address, right: Address) {
  return left.toRawString() === right.toRawString();
}

function resolveWalletContract(wallet: TonWallet, publicKey: Buffer): SupportedWalletContract {
  const address = Address.parse(wallet.address);
  const candidates = [
    WalletContractV5R1.create({ publicKey }),
    WalletContractV5Beta.create({ publicKey }),
    WalletContractV4.create({ workchain: address.workChain, publicKey }),
    WalletContractV3R2.create({ workchain: address.workChain, publicKey }),
    WalletContractV3R1.create({ workchain: address.workChain, publicKey }),
  ];
  const match = candidates.find((candidate) => sameTonAddress(candidate.address, address));
  if (!match) {
    throw new Error("Could not match Privy TON wallet contract version for this address.");
  }
  return match as SupportedWalletContract;
}

function tonPaymentReference() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function commentPayload(comment: string) {
  return beginCell().storeUint(0, 32).storeStringTail(comment).endCell();
}

export async function sendTonGenerationPayment({
  wallet,
  amountTon,
  signRawHash,
}: {
  wallet: TonWallet;
  amountTon: number | string;
  signRawHash: SignRawHash;
}) {
  if (!TON_TREASURY_WALLET) throw new Error("TON treasury wallet is not configured.");
  const publicKey = publicKeyBuffer(wallet.publicKey);
  const contract = resolveWalletContract(wallet, publicKey);
  const client = new TonClient({ endpoint: TON_MAINNET_ENDPOINT });
  const provider = client.provider(contract.address, contract.init);
  const seqno = await contract.getSeqno(provider);
  const reference = tonPaymentReference();
  const comment = `kult-generation:${reference}`;
  const message = internal({
    to: Address.parse(TON_TREASURY_WALLET),
    value: toNano(String(amountTon)),
    body: commentPayload(comment),
    bounce: false,
  });
  const transfer = await contract.createTransfer({
    seqno,
    signer: async (messageCell) => {
      const hash = messageCell.hash().toString("hex");
      const { signature } = await signRawHash({
        address: wallet.address,
        chainType: "ton",
        hash: `0x${hash}`,
      });
      return Buffer.from(signature.slice(2), "hex");
    },
    messages: [message],
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    timeout: Math.floor(Date.now() / 1000) + 300,
    authType: "external",
  });
  await client.sendExternalMessage(contract, transfer);
  return reference;
}
