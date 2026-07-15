type TelegramWebAppWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      platform?: string;
      version?: string;
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
