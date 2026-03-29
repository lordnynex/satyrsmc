import { defineConfig } from "tsup";

export default defineConfig({
  entry: { api: "src/netlify-handler.ts" },
  outDir: "netlify/functions",
  format: ["esm"],
  outExtension: () => ({ js: ".mjs" }),
  target: "node22",
  platform: "node",
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  noExternal: ["@satyrsmc/shared", "reflect-metadata", "serverless-http"],
  external: [/^@electric-sql/, "pg", "sharp", "pino-pretty", "typeorm-pglite"],
});
