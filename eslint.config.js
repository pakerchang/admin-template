import pluginRouter from "@tanstack/eslint-plugin-router";
import boundaries from "eslint-plugin-boundaries";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tailwind from "eslint-plugin-tailwindcss";
import globals from "globals";
import tseslint from "typescript-eslint";

const MODULE_TYPES = [
  "module",
  "module-api",
  "module-model",
  "module-ui",
  "module-mocks",
];
const MODULE_ENTRY = {
  element: { type: "module", fileInternalPath: "index.ts" },
};
const SAME_MODULE = (type) => ({
  element: { type, captured: { module: "{{ from.element.captured.module }}" } },
});
// 尚未搬進 app/shared/shells/modules 的舊目錄（spec §9 M5「未搬的 legacy 路徑暫列 ignore」）；M6 逐條移除
const LEGACY_PATHS = [
  "src/pages/**",
  "src/services/**",
  "src/components/**",
  // 本 commit 之後搬進 shared/app 即移除
  "src/{lib,hooks,utils,constants,plugins,types,locales}/**",
];

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/build/",
      "**/.git/",
      "**/.github/",
      "**/.vscode/",
      "**/public/",
      "**/*.d.ts",
    ],
  },
  ...tailwind.configs["flat/recommended"],
  // equivalent of eslint-plugin-prettier@4 "plugin:prettier/recommended"
  eslintConfigPrettier,
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "error",
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
    },
  },
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs["recommended-latest"],
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  tseslint.configs.recommended,
  pluginRouter.configs["flat/recommended"],
  {
    // ESLint 9 default is "warn"; v8 default was off
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.app.json",
      },
    },
    settings: {
      tailwindcss: {
        callees: ["cn"],
        config: "./tailwind.config.ts",
        cssFiles: [
          "**/*.css",
          "!**/node_modules/**",
          "!**/.*",
          "!**/dist",
          "!**/public",
        ],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.app.json",
        },
      },
      react: { version: "detect" },
      alias: {
        map: [["@/*", "./src/*"]],
        extends: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
    rules: {
      semi: ["error", "always"],
      // options live in .prettierrc (eslint-plugin-prettier 5 usePrettierrc)
      "prettier/prettier": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "warn",
      "tailwindcss/no-custom-classname": ["off"],
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-unresolved": "error",
      "import/no-duplicates": "error",
      "import/no-cycle": "error",
      "import/no-useless-path-segments": "error",
      "import/no-absolute-path": "error",
      "import/no-self-import": "error",
      "import/no-named-as-default": "error",
      "import/no-named-as-default-member": "off",
      "import/no-deprecated": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@tanstack/router/create-route-property-order": "error",
    },
  },
  {
    // dead while **/*.d.ts is ignored above; kept for parity with .eslintrc.json
    // ("@typescript-eslint/ban-types" dropped: removed in typescript-eslint v8)
    files: ["**/*.d.ts"],
    rules: {
      // eslintrc override re-extended ts recommended, resetting these to its defaults
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      parserOptions: { project: "./tsconfig.node.json" },
    },
  },
  // 依賴方向（spec §3.1、§7.2）
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        {
          type: "module-api",
          pattern: "src/modules/*/api",
          capture: ["module"],
        },
        {
          type: "module-model",
          pattern: "src/modules/*/model",
          capture: ["module"],
        },
        { type: "module-ui", pattern: "src/modules/*/ui", capture: ["module"] },
        {
          type: "module-mocks",
          pattern: "src/modules/*/mocks",
          capture: ["module"],
        },
        { type: "module", pattern: "src/modules/*", capture: ["module"] },
        { type: "shell", pattern: "src/shells/*", capture: ["shell"] },
        { type: "app", pattern: "src/app" },
        { type: "shared", pattern: "src/shared" },
      ],
      "boundaries/ignore": ["src/test/**", "**/__tests__/**", ...LEGACY_PATHS],
    },
    rules: {
      "boundaries/no-unknown-files": "error",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: [
                  { element: { type: ["app", "shared", "shell"] } },
                  MODULE_ENTRY,
                ],
              },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "shell" } },
              allow: { to: [{ element: { type: "shared" } }, MODULE_ENTRY] },
            },
            // default shell 屬 core：禁 import 任何 module（§4.4 D4 保證）
            {
              from: {
                element: { type: "shell", captured: { shell: "default" } },
              },
              disallow: { to: { element: { type: MODULE_TYPES } } },
            },
            // module 根（index.ts）→ 本 module 各 segment（route composition 只在這裡）
            {
              from: { element: { type: "module" } },
              allow: { to: MODULE_TYPES.map(SAME_MODULE) },
            },
            // module 內單向：ui → model → api；mocks → api（R18）
            {
              from: { element: { type: "module-ui" } },
              allow: { to: SAME_MODULE("module-model") },
            },
            {
              from: { element: { type: "module-model" } },
              allow: { to: SAME_MODULE("module-api") },
            },
            {
              from: { element: { type: "module-mocks" } },
              allow: { to: SAME_MODULE("module-api") },
            },
            // 所有 module 內部 → shared、他 module 的 index.ts（requires 由 build() 檢查）
            {
              from: { element: { type: MODULE_TYPES } },
              allow: { to: [{ element: { type: "shared" } }, MODULE_ENTRY] },
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/{app,shared,shells,modules}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/*"],
              message:
                "跨 module 只能 import `@/modules/<id>`（index.ts）；同 module 內用相對路徑",
            },
          ],
        },
      ],
    },
  }
);
