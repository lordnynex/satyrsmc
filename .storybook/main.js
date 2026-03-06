// This file has been automatically migrated to valid ESM format by Storybook.
import path, { dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const appAdminSrc = path.join(rootDir, "packages/app-admin/src");
const appPublicSrc = path.join(rootDir, "packages/app-public/src");

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function resolveWithExtensions(base, rel) {
  const full = path.join(base, rel);
  // Try direct file with extensions
  for (const ext of EXTENSIONS) {
    const withExt = full + ext;
    if (existsSync(withExt)) return withExt;
  }
  // Try index file in directory
  for (const ext of EXTENSIONS) {
    const indexPath = path.join(full, `index${ext}`);
    if (existsSync(indexPath)) return indexPath;
  }
  return null;
}

function aliasByImporterPlugin() {
  return {
    name: "alias-by-importer",
    resolveId(source, importer) {
      if (!source.startsWith("@/") || !importer) return null;
      const rel = source.slice(2);
      const normalizedImporter = path.normalize(importer).replace(/\\/g, "/");
      if (normalizedImporter.includes("packages/app-admin")) {
        return resolveWithExtensions(appAdminSrc, rel) ?? path.join(appAdminSrc, rel);
      }
      if (normalizedImporter.includes("packages/app-public")) {
        return resolveWithExtensions(appPublicSrc, rel) ?? path.join(appPublicSrc, rel);
      }
      return null;
    },
  };
}

async function viteFinal(config) {
  const tailwindcss = (await import("@tailwindcss/vite")).default;
  config.plugins = config.plugins || [];
  config.plugins.push(aliasByImporterPlugin(), tailwindcss());
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    "@app-admin": appAdminSrc,
    "@app-admin/": appAdminSrc + "/",
    "@app-public": appPublicSrc,
    "@app-public/": appPublicSrc + "/",
  };
  return config;
}

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  stories: [
    "../packages/app-admin/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../packages/app-public/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@github-ui/storybook-addon-performance-panel"),
  ],
  docs: {},
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal,
};

export default config;

function getAbsolutePath(value) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
