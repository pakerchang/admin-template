import { describe, expect, it } from "vitest";

import { ForbiddenError } from "@/shared/permission";

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
