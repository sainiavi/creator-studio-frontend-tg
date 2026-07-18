type TelegramWebAppWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      platform?: string;
      version?: string;
      openInvoice?: (url: string, callback?: (status: string) => void) => void;
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
  if (!webApp?.openInvoice) {
    return Promise.reject(new Error("Open this in Telegram to pay with Stars."));
  }

  return new Promise((resolve, reject) => {
    try {
      webApp.openInvoice(url, (status) => resolve(status));
    } catch (error) {
      reject(error);
    }
  });
}
