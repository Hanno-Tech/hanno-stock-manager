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
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Projeto Python à parte que mora no repo. Sem isto o eslint entra no
    // .venv (que traz o bundle do Playwright) e estoura a heap do Node.
    "scripts_scraper/**",
  ]),
]);

export default eslintConfig;
