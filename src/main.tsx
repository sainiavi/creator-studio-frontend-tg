import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { PrivyProvider } from "@privy-io/react-auth";
import { Buffer } from "buffer";
import { getRouter } from "./router";
import { VITE_PRIVY_APP_ID, PRIVY_CLIENT_ID, privyConfig } from "./lib/privyConfig";

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

createRoot(rootEl).render(
  <PrivyProvider appId={VITE_PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID} config={privyConfig}>
    <RouterProvider router={getRouter()} />
  </PrivyProvider>,
);
