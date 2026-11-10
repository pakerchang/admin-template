import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { parse } from "yaml";

import { extractOperations } from "../extract-operations";

import { operations } from "@/app/operations.gen";

const root = resolve(__dirname, "../..");
const fixture = (name: string) => join(__dirname, "fixtures", `${name}.yaml`);

/** 子行程實跑 extract（與 `pnpm gen:api:extract` 同一入口） */
const runExtract = (input: string) => {
  const out = join(
    mkdtempSync(join(tmpdir(), "extract-")),
    "operations.gen.ts"
  );
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "scripts/extract-operations.ts",
      "--in",
      input,
      "--out",
      out,
    ],
    { cwd: root, encoding: "utf8" }
  );
  return { ...result, out };
};

describe("extract-operations AC-2 斷言（exit 1 + 指名 operation，不寫檔）", () => {
  it.each([
    ["zero-tags", "listOrdersNoTag", "exactly one tag, got 0"],
    ["two-tags", "listOrdersTwoTags", "exactly one tag, got 2"],
    ["unknown-tag", "listOrdersUnknownTag", 'tag "billing" is not in'],
    ["duplicate-operation-id", "listOrdersDup", "duplicate operationId"],
    ["missing-permission", "listOrdersNoPermission", "missing x-permission"],
    ["permission-no-action", "listOrdersResourceOnly", "neither"],
    ["permission-wildcard", "listOrdersWildcard", "neither"],
    ["public-without-security", "loginNoSecurity", "security: [] is missing"],
    [
      "non-public-empty-security",
      "listOrdersEmptySecurity",
      "not public but has security: []",
    ],
  ])("%s → exit 1，訊息含 %s", (name, operationId, reason) => {
    const { status, stderr, out } = runExtract(fixture(name));
    expect(status).toBe(1);
    expect(stderr).toContain(operationId);
    expect(stderr).toContain(reason);
    expect(existsSync(out)).toBe(false);
  });

  it("正例：exit 0，寫出 operations 模組，{id} → :id", () => {
    const { status, stderr, out } = runExtract(fixture("valid"));
    expect(stderr).toBe("");
    expect(status).toBe(0);
    const text = readFileSync(out, "utf8");
    expect(text).toContain("as const satisfies TOperationTable;");
    expect(text).toContain('path: "/admin/orders/:id"');
    expect(text).toContain('login: "public"');
  });
});

describe("openapi.yaml 與現行 src/app/operations.gen.ts 一致（M7a）", () => {
  const extracted = extractOperations(
    parse(readFileSync(join(root, "openapi.yaml"), "utf8"))
  );
  const key = (r: { method: string; path: string; operationId: string }) =>
    `${r.method} ${r.path} ${r.operationId}`;

  it("routes：method + path + operationId 集合相同", () => {
    expect(extracted.routes.map(key).sort()).toEqual(
      operations.routes.map(key).sort()
    );
  });

  it("permissions：key 集合與每個值相同", () => {
    expect(extracted.permissions).toEqual(operations.permissions);
  });
});
