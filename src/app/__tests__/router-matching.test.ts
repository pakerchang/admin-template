import { describe, expect, it } from "vitest";

import { makeApp, routerAt } from "./fixture";

const matches = (path: string) => routerAt(makeApp(), "/").matchRoutes(path);

// Regression (ported from router pathless hotfix): react-router 1.170 stopped
// matching children under a `path: "/"` layout, so every protected page fell
// through to __root__ Not Found. The protected layout must stay pathless (id "/").
describe("module router matching", () => {
  it.each([
    ["/", "/_index/"],
    ["/users", "/users/"],
    ["/orders/9", "/orders/$id"],
    ["/tags", "/tags"],
    ["/products", "/products/"],
  ])("%s matches leaf %s under the protected layout", (path, leafId) => {
    const ids = matches(path).map((m) => m.routeId);
    expect(ids[0]).toBe("__root__");
    expect(ids[1]).toBe("/");
    expect(ids.at(-1)).toBe(leafId);
  });

  it("/orders/9 resolves params.id", () => {
    expect(matches("/orders/9").at(-1)?.params).toEqual({ id: "9" });
  });
});
