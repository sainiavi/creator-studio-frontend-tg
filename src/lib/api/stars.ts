import { api } from "../api";

export type StarsOrder = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  gameId?: string | null;
  tier?: number | null;
  starsAmount: number;
  currency: "XTR";
  productCode: "launch_boost" | "game_generation" | "game_edit";
  fulfilledAt?: string | null;
  paidAt?: string | null;
};

export async function createLaunchBoostOrder(gameId: string): Promise<StarsOrder> {
  const { data } = await api.post("/stars/orders", { productCode: "launch_boost", gameId });
  return data.order;
}

// Creates a Telegram Stars invoice to pay for one game generation on a tier.
export async function createGenerationStarsOrder(tier: 1 | 2 | 3): Promise<StarsOrder> {
  const { data } = await api.post("/stars/orders", { productCode: "game_generation", tier });
  return data.order;
}

// Creates a Telegram Stars invoice to pay for one AI edit on a tier.
export async function createEditStarsOrder(tier: 1 | 2 | 3): Promise<StarsOrder> {
  const { data } = await api.post("/stars/orders", { productCode: "game_edit", tier });
  return data.order;
}

export async function fetchStarsOrder(orderId: string): Promise<StarsOrder> {
  const { data } = await api.get(`/stars/orders/${encodeURIComponent(orderId)}`);
  return data.order;
}
