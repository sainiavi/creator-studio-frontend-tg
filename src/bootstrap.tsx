import { RouterProvider } from "@tanstack/react-router";
import { PrivyProvider } from "@privy-io/react-auth";
import { VITE_PRIVY_APP_ID, PRIVY_CLIENT_ID, privyConfig } from "./lib/privyConfig";

function loadDevStylesheet(): Promise<void> {
  return new Promise((resolve) => {
    const attempt = (tryCount = 0) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `/dev-styles.css?v=${Date.now()}`;
      link.onload = () => resolve();
      link.onerror = () => {
        link.remove();
        if (tryCount === 0) {
          console.info("[boot] waiting for dev-styles.css (Tailwind CLI is compiling…)");
        }
        window.setTimeout(() => attempt(tryCount + 1), 2000);
      };
      document.head.appendChild(link);
    };
    attempt();
  });
}

function loadStyles() {
  if (import.meta.env.DEV) {
    void loadDevStylesheet();
    return;
  }
  void import("./styles.css");
}

async function boot() {
  const root = window.__creatorStudioRoot;
  if (!root) throw new Error("React root missing — main.tsx must run first");

  loadStyles();

  const { getRouter } = await import("./router");
  root.render(
    <PrivyProvider appId={VITE_PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID} config={privyConfig}>
      <RouterProvider router={getRouter()} />
    </PrivyProvider>,
  );
}

void boot().catch((error) => {
  console.error("[boot] failed", error);
  window.__creatorStudioRoot?.render(
    <div style={{ padding: 24, color: "#fecaca", background: "#450a0a", minHeight: "100vh" }}>
      Boot failed: {error instanceof Error ? error.message : String(error)}
    </div>,
  );
});
