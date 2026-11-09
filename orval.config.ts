/**
 * orval：openapi.yaml 每個 tag 一個 target → src/modules/<id>/{api,mocks}（spec §4.5 orval config 列、R14、R15、K7）。
 * 保留 tag `core`（R29）跳過：client / mock 手寫於 shared/api/upload.ts、app/mock/core-handlers.ts。
 * 新增 module 只改 openapi.yaml 的 tags，不改本檔。
 *
 * M7a：只落檔、未執行 gen（會寫 src/modules，屬 M7b）；mutator 檔 src/shared/api/fetcher.ts 由 M7b 建立。
 */
import { readFileSync } from "node:fs";

import { defineConfig } from "orval";
import { parse } from "yaml";

const INPUT = "./openapi.yaml";
const SKIP_TAGS = new Set(["core"]);

const { tags } = parse(
  readFileSync(new URL(INPUT, import.meta.url), "utf8")
) as {
  tags: { name: string }[];
};

const target = (id: string) => ({
  input: { target: INPUT, filters: { tags: [id] } },
  output: {
    mode: "single" as const,
    target: `src/modules/${id}/api/${id}.ts`,
    schemas: `src/modules/${id}/api/model`,
    client: "react-query" as const,
    httpClient: "fetch" as const,
    mock: {
      path: `src/modules/${id}/mocks`,
      generators: [{ type: "msw" as const }],
    },
    clean: true,
    override: {
      mutator: { path: "src/shared/api/fetcher.ts", name: "fetcher" },
    },
  },
});

export default defineConfig(
  Object.fromEntries(
    tags
      .map(({ name }) => name)
      .filter((id) => !SKIP_TAGS.has(id))
      .map((id) => [id, target(id)])
  )
);
