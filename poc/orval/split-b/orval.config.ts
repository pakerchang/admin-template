import { defineConfig } from "orval";

// 切法 B：單一 openapi.yaml，每個 tag 一個 target，輸出到對應 module
const mod = (id: string) => ({
  input: { target: "../openapi.yaml", filters: { tags: [id] } },
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

export default defineConfig({ banners: mod("banners"), users: mod("users"), auth: mod("auth") });
