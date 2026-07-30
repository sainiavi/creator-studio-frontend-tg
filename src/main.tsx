import { createRoot } from "react-dom/client";
import { Suspense, lazy } from "react";
import { Buffer } from "buffer";
import { initTelegramWebApp } from "./lib/telegramMiniApp";
import { initDebugConsole } from "./lib/debug";

// Disables Telegram's native swipe-down-to-close gesture so it doesn't eat the
// vertical swipes our reel feed needs. No-op outside Telegram.
initTelegramWebApp();

// Opt-in on-screen console for debugging on a phone with no cable — visit any
// page with ?debug=1 once. No-op unless that flag has been set.
initDebugConsole();

// TON's browser bundle still reads the Node Buffer global while its module is
// being initialized. The create route is lazy-loaded, so install the browser
// implementation before that chunk can be evaluated (Telegram WebView does
// not provide Buffer itself).
globalThis.Buffer = Buffer;

// One CSS stack: Tailwind v4 (+ tw-animate-css). In dev, Tailwind runs via CLI
// (`npm run dev:css`) because @tailwindcss/vite blocks the dev server on first compile.
if (import.meta.env.DEV) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/dev-styles.css";
  document.head.appendChild(link);
} else {
  await import("./styles.css");
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root not found");

// Privy pulls in the Coinbase Wallet SDK, WalletConnect, viem, Solana, and TON
// support code (~700KB gzipped) even though this app only uses email/telegram
// login. Loading it lazily behind Suspense lets the shell paint immediately
// instead of every route blocking on that one download.
const App = lazy(() => import("./App"));

function LoadingShell() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0118",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.2)",
          borderTopColor: "#d946ef",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

createRoot(rootEl).render(
  <Suspense fallback={<LoadingShell />}>
    <App />
  </Suspense>,
);
