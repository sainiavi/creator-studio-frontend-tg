import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { PrivyProvider } from "@privy-io/react-auth";
import { getRouter } from "./router";
import { PRIVY_APP_ID, PRIVY_CLIENT_ID, privyConfig } from "./lib/privyConfig";

import "./styles.css";

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID} config={privyConfig}>
    <RouterProvider router={router} />
  </PrivyProvider>,
);
