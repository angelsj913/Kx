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
    // Electron main-process scripts are CommonJS Node code.
    "electron/**",
    "dist-electron/**",
  ]),
  {
    // Vercel lint 실패 방지: 데이터 fetch·localStorage 초기화 등 정당한 effect setState를 에러로 막음
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // Standalone CommonJS Node scripts (not bundled by Next) — require() is intentional here.
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
