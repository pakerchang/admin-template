import { describe, expect, it } from "vitest";

import { createCore } from "@/app/core";
import { createApp } from "@/app/kernel/create-app";
import { installModules } from "@/app/modules";
import { operations } from "@/app/operations.gen";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { defaultShell } from "@/shells/default";

import type { TOperationTable } from "@/shared/permission";

const appWith = (ops: TOperationTable) =>
  installModules(
    createApp({
      shell: defaultShell,
      operations: ops,
      apiBaseUrl,
      core: createCore(),
    })
  );

describe("hand-written app/operations.gen.ts (AC-3, R13 / R21 fail-closed)", () => {
  it("covers every METHOD path of the mock handler table, nothing more", () => {
    // M6 起 handler 表拆在 kernel core handler 與各 module 的 mocks/handlers.ts；guard（http.all "*"）除外
    const [, ...handlers] = appWith(operations).build().registry.mockHandlers;
    expect(
      operations.routes.map((r) => `${r.method} ${r.path}`).sort()
    ).toEqual(
      handlers
        .map((h) => `${h.info.method} ${new URL(String(h.info.path)).pathname}`)
        .sort()
    );
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
