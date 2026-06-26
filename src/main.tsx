import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { PrivyProvider } from "@privy-io/react-auth";
import { getRouter } from "./router";
import { initTelegramMiniApp } from "./lib/telegram-mini-app";

import "./styles.css";

initTelegramMiniApp();

const router = getRouter();
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID ?? "";

function MissingPrivyConfig() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#03070d] px-4 text-white">
      <div className="max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <h1 className="font-display text-xl font-black">Privy is not configured</h1>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Set <code className="rounded bg-white/10 px-1 py-0.5">VITE_PRIVY_APP_ID</code> to enable
          Telegram login and TON wallet creation.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  privyAppId ? (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["telegram"],
        appearance: {
          theme: "dark",
          accentColor: "#9a35ff",
          logo: undefined,
        },
      }}
    >
      <RouterProvider router={router} />
    </PrivyProvider>
  ) : (
    <MissingPrivyConfig />
  ),
);
