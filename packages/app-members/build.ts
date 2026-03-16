#!/usr/bin/env bun
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { copyFile, mkdir, readdir, rm } from "fs/promises";
import path from "path";

const outdir = process.env.OUTDIR
  ? path.resolve(process.env.OUTDIR)
  : path.join(process.cwd(), "dist");
if (existsSync(outdir)) {
  await rm(outdir, { recursive: true, force: true });
}

const entrypoints = [path.join(process.cwd(), "index.html")];

const isDev = process.env.BUILD_DEV === "1";
const apiOrigin = process.env.API_ORIGIN ?? process.env.VITE_API_ORIGIN ?? "";
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: !isDev,
  target: "browser",
  sourcemap: "linked",
  publicPath: "/admin/",
  define: {
    "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
    __BUILD_API_ORIGIN__: JSON.stringify(apiOrigin),
    __BUILD_GOOGLE_MAPS_API_KEY__: JSON.stringify(googleMapsApiKey),
  },
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

const favicon = path.join(process.cwd(), "public", "favicon.ico");
if (existsSync(favicon)) {
  await copyFile(favicon, path.join(outdir, "favicon.ico"));
}

const imagesDir = path.join(process.cwd(), "public", "images");
if (existsSync(imagesDir)) {
  const destImages = path.join(outdir, "images");
  await mkdir(destImages, { recursive: true });
  const files = await readdir(imagesDir);
  for (const file of files) {
    await copyFile(path.join(imagesDir, file), path.join(destImages, file));
  }
}
