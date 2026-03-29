import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["src/test/setup.ts"],
    globals: false,
    env: {
      VITE_API_ORIGIN: "",
      VITE_GOOGLE_MAPS_API_KEY: "",
      VITE_RECAPTCHA_SITE_KEY: "",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
