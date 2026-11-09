import pluginRouter from "@tanstack/eslint-plugin-router";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tailwind from "eslint-plugin-tailwindcss";
import globals from "globals";
import tseslint from "typescript-eslint";

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
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^_" }],
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
  }
);
