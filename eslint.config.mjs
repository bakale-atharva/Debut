import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react's auto-detection of the installed React version calls
  // the removed ESLint 9 `context.getFilename()` API and crashes under
  // ESLint 10. Setting the version explicitly skips that code path.
  { settings: { react: { version: "19.2.8" } } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code tooling directories (skill/agent templates, not app code):
    ".agents/**",
    ".claude/**",
    // Convex codegen output:
    "convex/_generated/**",
  ]),
]);

export default eslintConfig;
