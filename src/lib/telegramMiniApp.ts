type TelegramWebAppWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      platform?: string;
      version?: string;
      openInvoice?: (url: string, callback?: (status: string) => void) => void;
      ready?: () => void;
      expand?: () => void;
      disableVerticalSwipes?: () => void;
      isVersionAtLeast?: (version: string) => boolean;
    };
  };
};

function hasTelegramLaunchParams(value: string): boolean {
  const params = value.startsWith("?") || value.startsWith("#") ? value.slice(1) : value;

  return params.includes("tgWebAppData=");
}

export function isTelegramMiniApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const webApp = (window as TelegramWebAppWindow).Telegram?.WebApp;
  if (webApp?.initData || webApp?.platform || webApp?.version) {
    return true;
  }

  return (
    hasTelegramLaunchParams(window.location.search) || hasTelegramLaunchParams(window.location.hash)
  );
}

export function openTelegramInvoice(url: string): Promise<string> {
  const webApp = typeof window === "undefined"
    ? undefined
    : (window as TelegramWebAppWindow).Telegram?.WebApp;
  const openInvoice = webApp?.openInvoice;
  if (!openInvoice) {
    return Promise.reject(new Error("Open this in Telegram to pay with Stars."));
  }

  return new Promise((resolve, reject) => {
    try {
      openInvoice(url, (status) => resolve(status));
    } catch (error) {
      reject(error);
    }
  });
}

// Bootstraps the Telegram Mini App SDK (loaded via the telegram-web-app.js
// script tag in index.html). Without disableVerticalSwipes(), Telegram's own
// swipe-down-to-close/minimize gesture competes with our vertical reel feed —
// on-device that gesture wins and the feed appears completely unresponsive to
// touch, even though the exact same code scrolls fine via mouse wheel on
// desktop (where no such native gesture exists).
export function initTelegramWebApp(): void {
  if (typeof window === "undefined") return;
  const webApp = (window as TelegramWebAppWindow).Telegram?.WebApp;
  if (!webApp) return;
  try {
    webApp.ready?.();
    webApp.expand?.();
    webApp.disableVerticalSwipes?.();
  } catch {
    // Older clients may not implement one of these calls — ignore.
  }
}
