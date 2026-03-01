#!/usr/bin/env bun
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";

const outdir = process.env.OUTDIR ? path.resolve(process.env.OUTDIR) : path.join(process.cwd(), "dist");
if (existsSync(outdir)) {
  await rm(outdir, { recursive: true, force: true });
}

const entrypoints = [path.join(process.cwd(), "index.html")];
const apiOrigin = process.env.API_ORIGIN ?? process.env.VITE_API_ORIGIN ?? "";

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  publicPath: "/",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "__BUILD_API_ORIGIN__": JSON.stringify(apiOrigin),
  },
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}
