import { describe, expect, it } from "vitest";

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
  const runBeforeLoad = (route: any) => route.options.beforeLoad({});

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
});
