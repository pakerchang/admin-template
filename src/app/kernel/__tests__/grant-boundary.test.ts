import { beforeEach, describe, expect, it } from "vitest";

import { fixtureShell, makeApp } from "@/app/__tests__/fixture";
import { createCore } from "@/app/core";
import { createApp } from "@/app/kernel/create-app";
import { operations } from "@/app/operations.gen";
import { apiBaseUrl } from "@/shared/api/fetcher";
import { getAuth, setAuth } from "@/shared/api/session";

import type { TAuthSession } from "@/shared/api/session";
import type { TOperationTable } from "@/shared/permission";

/**
 * T1 AC-5：session.grants 進入前端的兩個入口以「已 .use() module」組出的 grant schema 逐筆 safeParse；
 * 不合法者丟棄（fail-closed 不變）。引用 domain 權限字串 → 列在 verify-core-only.sh 的 FULL_INSTALL_TESTS。
 */
const MIXED = ["orders:read", "orders:raed", "orders:*", "*", "nope", 123];
const user = { user_id: "1", email: "a@b.c", name: "a", role: "admin" };
const session = (grants: unknown[]) =>
  ({ token: "t", user, grants }) as unknown as TAuthSession;
const stored = () =>
  (JSON.parse(localStorage.getItem("auth")!) as TAuthSession).grants;

/** 兩個入口：login 回應寫入 session（setAuth）、getAuth() 讀 localStorage */
const viaLogin = (grants: unknown[]) => {
  setAuth(session(grants));
  return stored();
};
const viaStorage = (grants: unknown[]) => {
  localStorage.setItem("auth", JSON.stringify(session(grants)));
  return getAuth()?.grants;
};

const withoutOrders = () => {
  const modules = makeApp()
    .build()
    .registry.modules.filter((m) => m.id !== "orders");
  const keep = new Set(
    Object.entries(operations.permissions)
      .filter(([, p]) => !p.startsWith("orders:"))
      .map(([id]) => id)
  );
  const ops: TOperationTable = {
    routes: operations.routes.filter((r) => keep.has(r.operationId)),
    permissions: Object.fromEntries(
      Object.entries(operations.permissions).filter(([id]) => keep.has(id))
    ),
  };
  const app = createApp({
    shell: fixtureShell,
    operations: ops,
    apiBaseUrl,
    core: createCore(),
  });
  for (const m of modules) app.use(m);
  return app;
};

beforeEach(() => localStorage.clear());

describe.each([
  ["login response → session", viaLogin],
  ["getAuth() ← localStorage", viaStorage],
])("grant boundary safeParse: %s (T1 AC-5)", (_, enter) => {
  it("keeps only grants valid against the installed catalog", () => {
    makeApp().build();
    expect(enter(MIXED)).toEqual(["orders:read", "orders:*", "*"]);
  });

  it("keeps fully valid grants as-is", () => {
    makeApp().build();
    const valid = ["app:access", "tags:*", "users:update-role", "*"];
    expect(enter(valid)).toEqual(valid);
  });

  it("drops orders grants when orders is not .use()'d", () => {
    withoutOrders().build();
    expect(enter(MIXED)).toEqual(["*"]);
  });
});
