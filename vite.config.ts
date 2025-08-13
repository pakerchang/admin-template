/// <reference types="vitest" />
import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (id.includes("react")) return "react-vendor";
          if (id.includes("react-dom")) return "react-dom-vendor";
          if (
            [
              "@tanstack/react-query",
              "@tanstack/react-query-devtools",
              "@tanstack/react-router",
              "@tanstack/react-router-devtools",
            ].some((v) => id.includes(v))
          ) {
            return "tanstack-vendor";
          }
          if (
            [
              "@radix-ui/react-collapsible",
              "@radix-ui/react-dialog",
              "@radix-ui/react-separator",
              "@radix-ui/react-slot",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-label",
              "@radix-ui/react-radio-group",
              "@radix-ui/react-select",
              "@radix-ui/react-toast",
            ].some((v) => id.includes(v))
          ) {
            return "ui-vendor";
          }
          if (
            ["react-hook-form", "@hookform/resolvers", "zod"].some((v) =>
              id.includes(v)
            )
          ) {
            return "form-vendor";
          }
          if (
            ["axios", "dayjs", "ramda", "immer"].some((v) => id.includes(v))
          ) {
            return "utils-vendor";
          }
          if (
            id.includes("@faker-js/faker") ||
            id.includes("@anatine/zod-mock")
          )
            return "mock-vendor";
        },
      },
    },
  },
});
