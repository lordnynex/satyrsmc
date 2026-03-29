import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    testTimeout: 30000,
    globals: false,
  },
});
