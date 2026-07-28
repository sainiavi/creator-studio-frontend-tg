import { isTelegramMiniApp } from "./telegramMiniApp";

/** Browser uses 0G; Telegram mini-app uses TON for per-game legacy billing. */
export function getStudioChainPaymentMethod(): "0g" | "ton" {
  return isTelegramMiniApp() ? "ton" : "0g";
}

export function getStudioChainCurrency(): "0G" | "TON" {
  return getStudioChainPaymentMethod() === "0g" ? "0G" : "TON";
}
