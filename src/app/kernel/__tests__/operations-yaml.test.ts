import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { createCore } from "@/app/core";
import { createApp } from "@/app/kernel/create-app";
import { installModules } from "@/app/modules";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { defaultShell } from "@/shells/default";

import { extractOperations } from "../../../../scripts/extract-operations";

import type { TOperationTable } from "@/shared/permission";

/** 實際 10 個 module + 指定的 operation 表 */
const appWith = (operations: TOperationTable) =>
  installModules(
    createApp({
      shell: defaultShell,
      operations,
      apiBaseUrl,
      core: createCore(),
    })
  );

const yaml = readFileSync("openapi.yaml", "utf8");
/** extract 的值型別較寬（string）；產出的 operations.gen.ts 以 TOperationTable 標註，這裡比照 */
const extract = (text: string) =>
  extractOperations(parse(text)) as TOperationTable;

describe("openapi.yaml → extract → build() with the 10 installed modules (M7 AC-3, R21 / R27)", () => {
  it("installs exactly 10 modules", () => {
    expect(appWith(extract(yaml)).build().registry.modules).toHaveLength(10);
  });

  it("build() accepts the operations extracted from the real YAML", () => {
    expect(() => appWith(extract(yaml)).build()).not.toThrow();
  });

  it("an x-permission outside every module catalog (orders:typo) passes extract but build() throws naming the operation", () => {
    const typo = yaml.replace(
      /(operationId: listOrders\n(?:.*\n)*?\s*x-permission: )orders:read/,
      "$1orders:typo"
    );
    expect(typo).not.toBe(yaml);
    // R27：extract（gen 期）只查格式，不比對權限目錄
    const operations = extract(typo);
    expect(operations.permissions.listOrders).toBe("orders:typo");
    expect(() => appWith(operations).build()).toThrow(
      `operation "listOrders" requires "orders:typo" which is not in any installed module's permission catalog`
    );
  });
});
