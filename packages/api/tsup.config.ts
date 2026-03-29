import { defineConfig } from "tsup";

export default defineConfig({
  entry: { api: "src/netlify-handler.ts" },
  outDir: "netlify/functions",
  format: ["esm"],
  outExtension: () => ({ js: ".mjs" }),
  target: "node22",
  platform: "node",
  bundle: true,
  sourcemap: true,
  clean: true,
  noExternal: ["@satyrsmc/shared"],
  external: [/^@electric-sql/, "pg", "sharp"],
});
