import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach } from "bun:test";
import { cleanup } from "@testing-library/react";
import { configure } from "@testing-library/react";

GlobalRegistrator.register();

// Define build-time globals that Bun.build() normally provides via `define`
(globalThis as Record<string, unknown>).__BUILD_API_ORIGIN__ = "";
(globalThis as Record<string, unknown>).__BUILD_GOOGLE_MAPS_API_KEY__ = "";
(globalThis as Record<string, unknown>).__BUILD_RECAPTCHA_SITE_KEY__ = "";

// Suppress React 19 act() warnings from async third-party component updates
// (e.g., shadcn Select/SelectItem rendering after mock data resolves).
// waitFor() and userEvent already batch updates correctly.
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("was not wrapped in act")) {
    return;
  }
  originalError.apply(console, args);
};

configure({ reactStrictMode: true });

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});
