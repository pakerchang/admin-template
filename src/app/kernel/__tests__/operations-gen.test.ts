import { describe, expect, expectTypeOf, it } from "vitest";

import { createCore } from "@/app/core";
import { createApp } from "@/app/kernel/create-app";
import { installModules } from "@/app/modules";
import { operations } from "@/app/operations.gen";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { defaultShell } from "@/shells/default";

import type { TOperationTable, TPermission } from "@/shared/permission";

const appWith = (ops: TOperationTable) =>
  installModules(
    createApp({
      shell: defaultShell,
      operations: ops,
      apiBaseUrl,
      core: createCore(),
    })
  );

describe("generated app/operations.gen.ts (AC-3, R13 / R21 fail-closed)", () => {
  it("covers every METHOD path of the mock handlers, nothing more", () => {
    // guard / delay（http.all，method 為 RegExp）除外；core handler 為絕對 URL、orval 產物為 `*/path`；手寫非 200 handler 與 orval handler 同 path（去重）
    const paths = appWith(operations)
      .build()
      .registry.mockHandlers.filter((h) => typeof h.info.method === "string")
      .map((h) => {
        const path = String(h.info.path);
        return `${h.info.method} ${path.startsWith("*") ? path.slice(1) : new URL(path).pathname}`;
      });
    expect(
      operations.routes.map((r) => `${r.method} ${r.path}`).sort()
    ).toEqual([...new Set(paths)].sort());
  });

  it("build() accepts the real table with the 10 installed modules", () => {
    expect(() => appWith(operations).build()).not.toThrow();
  });

  it("build() throws once any operation loses its permission key", () => {
    for (const { operationId } of operations.routes) {
      const permissions = { ...operations.permissions };
      delete permissions[operationId];
      expect(() => appWith({ ...operations, permissions }).build()).toThrow(
        `operation "${operationId}" has no permission declared (use "public" explicitly)`
      );
    }
  });

  it("only login is public", () => {
    expect(
      Object.entries(operations.permissions)
        .filter(([, p]) => p === "public")
        .map(([id]) => id)
    ).toEqual(["login"]);
  });
});

describe("operations.gen.ts permission values are typed (T1 AC-3)", () => {
  type TOperationPermission = TOperationTable["permissions"][string];

  it('values narrow to TPermission | "public"', () => {
    expectTypeOf<TOperationPermission>().toEqualTypeOf<
      TPermission | "public"
    >();
    expectTypeOf(operations).toExtend<TOperationTable>();
    // users 是 generic module（core-only 仍在），故用 users 而非 domain 權限
    const ok: TOperationPermission = "users:read";
    // @ts-expect-error resource:action not in the registry
    const typo: TOperationPermission = "users:raed";
    // @ts-expect-error resource not in the registry
    const resource: TOperationPermission = "user:read";
    expect([ok, typo, resource]).toHaveLength(3);
  });
});
