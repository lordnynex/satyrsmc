import eslint from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "**/dist/**",
      "out/**",
      "coverage/**",
      "storybook-static/**",
      "packages/api/netlify/**",
      "*.config.js",
    ],
  },

  // Base: recommended rules for all JS/TS
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // All TypeScript files: strict rules per AGENTS.md
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },

  // API package: Node/Bun globals
  {
    files: ["packages/api/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // React packages: browser globals + React lint rules
  {
    files: ["packages/app-members/**/*.{ts,tsx}", "packages/app-public/**/*.{ts,tsx}"],
    ...eslintReact.configs.recommended,
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...eslintReact.configs.recommended.rules,
      // Common pattern: syncing form state from props in useEffect
      "@eslint-react/hooks-extra/no-direct-set-state-in-use-effect": "off",
    },
  },
);
