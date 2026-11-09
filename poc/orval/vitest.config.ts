import { defineConfig } from "vitest/config";

// 有這支才不會往上層吃到 repo root 的 vite.config（setupFiles: src/test/setup.ts）
export default defineConfig({ test: { environment: "node", include: ["test/**/*.test.ts"] } });
