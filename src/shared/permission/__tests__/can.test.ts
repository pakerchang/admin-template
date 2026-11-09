import { describe, expect, it, vi } from "vitest";

import { can } from "../can";
import { ForbiddenError } from "../forbidden";
import { guardedRoute } from "../guarded-route";

import type { TGrant, TPermission } from "../types";

describe("can()", () => {
  it.each<[TGrant[], TPermission, boolean]>([
    [["*"], "orders:read", true],
    [["orders:*"], "orders:export", true],
    [["orders:read"], "orders:read", true],
    [["orders:read"], "orders:update", false],
    [["order:*"], "orders:read", false],
    [[], "app:access", false],
  ])("can(%j, %s) === %s", (grants, p, expected) =>
    expect(can(grants, p)).toBe(expected)
  );
});

describe("guardedRoute()", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runBeforeLoad = (route: any, ctx = {}) => route.options.beforeLoad(ctx);

  it("throws ForbiddenError when the grant is missing", () => {
    const route = guardedRoute(
      { path: "orders", permission: "orders:read" },
      () => []
    );
    expect(() => runBeforeLoad(route)).toThrow(ForbiddenError);
    expect(route.options.staticData).toMatchObject({
      permission: "orders:read",
    });
  });

  it("passes when granted, and 'authenticated' needs no grant", () => {
    const granted = guardedRoute(
      { path: "orders", permission: "orders:read" },
      () => ["orders:*"]
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
      { path: "orders", permission: "orders:read", beforeLoad: original },
      () => ["orders:read"]
    );
    const ctx = { marker: "ctx" };
    expect(runBeforeLoad(route, ctx)).toEqual({ extra: 1 });
    expect(original).toHaveBeenCalledWith(ctx);
  });

  it("does not call the original beforeLoad when denied", () => {
    const original = vi.fn();
    const route = guardedRoute(
      { path: "orders", permission: "orders:read", beforeLoad: original },
      () => []
    );
    expect(() => runBeforeLoad(route)).toThrow(ForbiddenError);
    expect(original).not.toHaveBeenCalled();
  });
});
