import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "./openapi.yaml",
    output: {
      mode: "tags-split",
      target: "./generated/api",
      schemas: "./generated/model",
      client: "react-query",
      httpClient: "fetch",
      mock: true,
      clean: true,
      // ponytail: PoC 在 node 跑需要絕對 URL；正式整合改用 override.mutator（fetcher.ts）
      baseUrl: "http://api.test",
    },
  },
  zod: {
    input: "./openapi.yaml",
    output: {
      mode: "tags-split",
      target: "./generated/zod",
      client: "zod",
      fileExtension: ".zod.ts",
      clean: true,
    },
  },
});
