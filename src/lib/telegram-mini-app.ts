type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  enableClosingConfirmation?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp() {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function isTelegramMiniApp() {
  return Boolean(getTelegramWebApp()?.initData);
}

export function getTelegramUsername() {
  const user = getTelegramWebApp()?.initDataUnsafe?.user;
  if (!user) return null;
  return user.username ?? [user.first_name, user.last_name].filter(Boolean).join(" ") ?? null;
}

export function initTelegramMiniApp() {
  const webApp = getTelegramWebApp();
  if (!webApp) return;

  webApp.ready?.();
  webApp.expand?.();
  webApp.enableClosingConfirmation?.();
  webApp.disableVerticalSwipes?.();
  webApp.setHeaderColor?.("#03070d");
  webApp.setBackgroundColor?.("#03070d");
}
