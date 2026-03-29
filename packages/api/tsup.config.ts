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
  noExternal: [/^(?!sharp$|pg$|pino-pretty$|typeorm-pglite$|@electric-sql)/],
  external: [/^@electric-sql/, "pg", "sharp", "pino-pretty", "typeorm-pglite"],
  shims: true,
  banner: {
    js: `import { createRequire } from "node:module"; const require = Object.assign(createRequire(import.meta.url), { main: { filename: import.meta.url.replace(/^file:\\/\\//, "") } });`,
  },
});
