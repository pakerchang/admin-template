import { describe, expect, it, vi } from "vitest";

import { can } from "../can";
import { ForbiddenError } from "../forbidden";
import { guardedRoute } from "../guarded-route";

import type { TGrant, TPermission } from "../types";

/** typed-contracts T1：fixture 刻意含 registry 外 / core-only 不存在的權限字串 → 以 string 宣告、在注入點 cast（執行期行為不變） */
const perm = (p: string) => p as TPermission;
const grants = (g: string[]) => g as TGrant[];

describe("can()", () => {
  it.each<[string[], string, boolean]>([
    [["*"], "orders:read", true],
    [["orders:*"], "orders:export", true],
    [["orders:read"], "orders:read", true],
    [["orders:read"], "orders:update", false],
    [["order:*"], "orders:read", false],
    [[], "app:access", false],
    // 負向：只認完全相等，不做正規化或前綴比對
    [["Orders:read"], "orders:read", false],
    [["ORDERS:*"], "orders:read", false],
    [["orders::read"], "orders:read", false],
    [["orders:read:"], "orders:read", false],
    [["orders::*"], "orders:read", false],
    [[" orders:read"], "orders:read", false],
    [["orders:read "], "orders:read", false],
    // grants 來自 login response JSON，執行期可能不符型別
    [["orders"], "orders:read", false],
    [["orders:"], "orders:read", false],
  ])("can(%j, %s) === %s", (g, p, expected) =>
    expect(can(grants(g), perm(p))).toBe(expected)
  );
});

describe("guardedRoute()", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runBeforeLoad = (route: any, ctx = {}) => route.options.beforeLoad(ctx);

  it("throws ForbiddenError when the grant is missing", () => {
    const route = guardedRoute(
      { path: "orders", permission: perm("orders:read") },
      () => []
    );
    expect(() => runBeforeLoad(route)).toThrow(ForbiddenError);
    expect(route.options.staticData).toMatchObject({
      permission: "orders:read",
    });
  });

  it("passes when granted, and 'authenticated' needs no grant", () => {
    const granted = guardedRoute(
      { path: "orders", permission: perm("orders:read") },
      () => grants(["orders:*"])
    );
    const authed = guardedRoute(
      { path: "me", permission: "authenticated" },
      () => []
    );
    expect(() => runBeforeLoad(granted)).not.toThrow();
    expect(() => runBeforeLoad(authed)).not.toThrow();
  });

  it("keeps the original beforeLoad: called with ctx when allowed, return value preserved", () => {
    const original = vi.fn(() => ({ extra: 1 }));
    const route = guardedRoute(
      { path: "orders", permission: perm("orders:read"), beforeLoad: original },
      () => grants(["orders:read"])
    );
    const ctx = { marker: "ctx" };
    expect(runBeforeLoad(route, ctx)).toEqual({ extra: 1 });
    expect(original).toHaveBeenCalledWith(ctx);
  });

  it("does not call the original beforeLoad when denied", () => {
    const original = vi.fn();
    const route = guardedRoute(
      { path: "orders", permission: perm("orders:read"), beforeLoad: original },
      () => []
    );
    expect(() => runBeforeLoad(route)).toThrow(ForbiddenError);
    expect(original).not.toHaveBeenCalled();
  });
});
