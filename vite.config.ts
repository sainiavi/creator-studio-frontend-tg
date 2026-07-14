import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routeFileIgnorePattern: ".*\\.full\\.tsx$",
    }),
    react(),
    // Tailwind blocks the dev server for minutes on first compile — build CSS via
    // `npm run dev:css` instead and serve it from /public in development.
    ...(command === "build" ? [tailwindcss()] : []),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ["**/public/templates/**", "**/*index.full.tsx"],
    },
  },
  build: {
    outDir: "dist",
  },
}));
