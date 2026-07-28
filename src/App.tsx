import { RouterProvider } from "@tanstack/react-router";
import { PrivyProvider } from "@privy-io/react-auth";
import { router } from "./router";
import { VITE_PRIVY_APP_ID, PRIVY_CLIENT_ID, privyConfig } from "./lib/privyConfig";

export default function App() {
  return (
    <PrivyProvider appId={VITE_PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID} config={privyConfig}>
      <RouterProvider router={router} />
    </PrivyProvider>
  );
}
