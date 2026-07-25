import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-*/**",
    ".vercel/**",
    // Local worktrees and archived snapshots carry their own checkout of the app; linting
    // them buries real findings under tens of thousands of duplicate problems.
    ".worktrees/**",
    ".archives/**",
    "out/**",
    "build/**",
    "docs/**",
    "reports/**",
    "reference-repos/**",
    "tsconfig.tsbuildinfo",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
