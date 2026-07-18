import { api } from "../api";

export type StarsOrder = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  gameId: string;
  starsAmount: number;
  currency: "XTR";
  productCode: "launch_boost";
  fulfilledAt?: string | null;
  paidAt?: string | null;
};

export async function createLaunchBoostOrder(gameId: string): Promise<StarsOrder> {
  const { data } = await api.post("/stars/orders", { productCode: "launch_boost", gameId });
  return data.order;
}

export async function fetchStarsOrder(orderId: string): Promise<StarsOrder> {
  const { data } = await api.get(`/stars/orders/${encodeURIComponent(orderId)}`);
  return data.order;
}
