import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";

import { routeTree } from "@/router/routes";
import { clearAuth, setAuth } from "@/services/api-client";

const makeRouter = (path = "/") =>
  createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });

const matchIds = (path: string) =>
  makeRouter()
    .matchRoutes(path)
    .map((m) => m.routeId);

// Regression: react-router 1.170 stopped matching children under a
// `path: "/"` layout, so every protected page fell through to __root__ Not Found.
describe("routeTree matching", () => {
  it.each([
    ["/", "/_index/"],
    ["/users", "/users/"],
    ["/orders/9", "/orders/$id"],
    ["/tags", "/tags"],
    ["/products", "/products/"],
  ])("%s matches leaf %s under the protected layout", (path, leafId) => {
    const ids = matchIds(path);
    expect(ids[0]).toBe("__root__");
    expect(ids[1]).toBe("/");
    expect(ids.at(-1)).toBe(leafId);
  });

  it("/orders/9 resolves params.id", () => {
    const leaf = makeRouter().matchRoutes("/orders/9").at(-1);
    expect(leaf?.params).toEqual({ id: "9" });
  });
});

describe("protected layout auth guard", () => {
  afterEach(() => clearAuth());

  it("redirects unauthenticated /users to /login", async () => {
    clearAuth();
    const router = makeRouter("/users");
    await router.load();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("keeps authenticated /users", async () => {
    setAuth({
      token: "t",
      user: { user_id: "1", email: "a@b.c", name: "a", role: "user" },
    });
    const router = makeRouter("/users");
    await router.load();
    expect(router.state.location.pathname).toBe("/users");
  });
});
