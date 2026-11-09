import { defineConfig } from "orval";

// 切法 A：每個 module 自帶 openapi.yaml，一個 module 一個 target
const mod = (id: string) => ({
  input: {
    target: `./modules/${id}/openapi.yaml`,
    // 坑：orval 8 預設禁外部 $ref（exit 1），要逐檔白名單
    parserOptions: { externalRefs: { allow: ["../../shared/openapi/common.yaml"] } },
  },
  output: {
    mode: "single" as const,
    target: `./modules/${id}/api/${id}.ts`,
    schemas: `./modules/${id}/model`,
    client: "react-query" as const,
    httpClient: "fetch" as const,
    mock: { path: `./modules/${id}/mocks`, generators: [{ type: "msw" as const }] },
    clean: true,
    baseUrl: "http://api.test", // ponytail: 同 a1，正式整合換 override.mutator
  },
});

export default defineConfig({ banners: mod("banners"), users: mod("users") });
