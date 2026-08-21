// Import ESLint config utility functions
import { defineConfig, globalIgnores } from "eslint/config";
// Import Next.js core web vitals ESLint rules
import nextVitals from "eslint-config-next/core-web-vitals";
// Import Next.js TypeScript ESLint rules
import nextTs from "eslint-config-next/typescript";
// Import Prettier flat config to disable formatting rules handled by Prettier
import prettier from "eslint-config-prettier/flat"

const eslintConfig = defineConfig([
  // Apply Next.js Core Web Vitals rules
  ...nextVitals,
  // Apply Next.js TypeScript rules
  ...nextTs,
  // Turn off ESLint rules that might conflict with Prettier
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
