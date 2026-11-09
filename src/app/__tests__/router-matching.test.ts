import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createCore } from "@/app/core";
import { createApp } from "@/app/kernel/create-app";
import { installModules } from "@/app/modules";
import { operations } from "@/app/operations.gen";
import { apiBaseUrl, clearAuth, setAuth } from "@/services/api-client";

import { fixtureShell, makeApp, routerAt } from "./fixture";

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

// 不覆寫 isAuthenticated / getGrants：走 setAuth/clearAuth → getAuth → 預設 createCore() → guard 整條接線
const realSessionApp = () =>
  installModules(
    createApp({
      shell: fixtureShell,
      operations,
      apiBaseUrl,
      core: createCore(),
    })
  );

describe("protected guard with real session and default core", () => {
  beforeEach(() => clearAuth());
  afterEach(() => clearAuth());

  it("redirects unauthenticated /users to /login", async () => {
    const router = routerAt(realSessionApp(), "/users");
    await router.load();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("keeps authenticated /users", async () => {
    setAuth({
      token: "t",
      user: { user_id: "1", email: "a@b.c", name: "a", role: "user" },
      grants: ["app:access", "users:read"],
    });
    const router = routerAt(realSessionApp(), "/users");
    await router.load();
    expect(router.state.location.pathname).toBe("/users");
    expect(router.state.matches.at(-1)?.routeId).toBe("/users/");
    expect(router.state.matches.every((m) => !m.error)).toBe(true);
  });
});
