import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { configure } from "@testing-library/react";

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
