import { describe, expect, it } from "vitest";

import { corePermissions, ForbiddenError } from "@/shared/permission";

import { makeApp, routerAt } from "./fixture";

import type { AnyRoute } from "@tanstack/react-router";

const descendants = (route: AnyRoute): AnyRoute[] =>
  ((route.children as AnyRoute[] | undefined) ?? []).flatMap((c) => [
    c,
    ...descendants(c),
  ]);

/** route id / fullPath 在 router 初始化時才算出：經 routerAt 建 router 後再走訪 */
const protectedSubtree = () => {
  const { routeTree } = routerAt(makeApp(), "/");
  const protectedRoute = (routeTree.children as AnyRoute[]).find(
    (r) => r.id === "/"
  )!;
  return [protectedRoute, ...descendants(protectedRoute)];
};

describe("protected subtree permission structure (AC-5, §6.2)", () => {
  it("every route under protected declares staticData.permission", () => {
    const missing = protectedSubtree()
      .filter((r) => !r.options.staticData?.permission)
      .map((r) => r.id);
    expect(missing).toEqual([]);
  });

  it("every module page/layout route carries the injected ForbiddenBoundary", () => {
    const modulesRoutes = protectedSubtree().filter(
      (r) => r.id !== "/" && !r.id.startsWith("/_index")
    );
    expect(modulesRoutes.length).toBeGreaterThan(10);
    for (const r of modulesRoutes)
      expect([
        r.id,
        (r.options.errorComponent as { name?: string })?.name,
      ]).toEqual([r.id, "ForbiddenBoundary"]);
  });
});

describe("F-1 AC-3：寫入表單 route 不能只要 :read", () => {
  /** D2（OD-GRANT-1）：users 編輯表單是 stub、無 API，owner 接受 admin 可開表單、送出 disabled */
  const EXCEPT = ["users.edit"];

  it("routeId 結尾 .create / .edit / .draft 的 route 不是 :read", () => {
    const formRoutes = protectedSubtree()
      .map((r) => r.options.staticData ?? {})
      .filter((s) => /\.(create|edit|draft)$/.test(s.routeId ?? ""))
      .filter((s) => !EXCEPT.includes(s.routeId!));
    expect(formRoutes.length).toBe(8);
    expect(
      formRoutes.find((s) => s.routeId === "users.create")?.permission
    ).toBe("users:create");
    expect(
      formRoutes.filter((s) => String(s.permission).endsWith(":read"))
    ).toEqual([]);
  });
});

describe("superadmin grants keep every page reachable (AC-6 automated part)", () => {
  const leafPaths = () =>
    protectedSubtree()
      .filter((r) => !r.children?.length && r.fullPath !== "/")
      .map((r) => r.fullPath.replace("$id", "1"));

  it.each([
    ["*", true],
    ["none", false],
  ])("grants %s → no ForbiddenError: %s", async (who, reachable) => {
    const paths = leafPaths();
    expect(paths.length).toBeGreaterThan(15);
    for (const path of paths) {
      const router = routerAt(
        makeApp({ getGrants: () => (who === "*" ? ["*"] : []) }),
        path
      );
      await router.load();
      const forbidden = router.state.matches.some(
        (m) => m.error instanceof ForbiddenError
      );
      expect([path, forbidden]).toEqual([path, !reachable]);
    }
  });
});

describe("permission catalog single source (T1 AC-10)", () => {
  it("each installed module's permissions.resources equals its Zod catalog", () => {
    const modules = makeApp()
      .build()
      .registry.modules.filter((m) => m.permissions);
    expect(modules.length).toBeGreaterThan(0);
    for (const m of modules) {
      const { resources, catalog } = m.permissions!;
      expect([m.id, resources]).toEqual([
        m.id,
        Object.fromEntries(
          Object.entries(catalog).map(([r, actions]) => [r, actions.options])
        ),
      ]);
    }
  });

  it("core catalog carries app:access", () => {
    expect(corePermissions.catalog.app.options).toEqual(["access"]);
    expect(corePermissions.resources).toEqual({ app: ["access"] });
  });
});
