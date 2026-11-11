import { readFileSync } from "fs";

import { RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeApp, routerAt } from "./fixture";

/** 重構前（master routes.tsx）router.routesByPath 的全部 key，於刪除前實測擷取 */
const LEGACY_FULL_PATHS = [
  "/",
  "/articles",
  "/articles/create",
  "/articles/edit/$id",
  "/banners",
  "/banners/create",
  "/banners/edit/$id",
  "/customers",
  "/login",
  "/orders",
  "/orders/$id",
  "/orders/order-list",
  "/products",
  "/products/create",
  "/products/draft/$id",
  "/products/edit/$id",
  "/suppliers",
  "/tags",
  "/team-members",
  "/users",
  "/users/create",
  "/users/edit/$id",
];

describe("module wiring (M3)", () => {
  it("AC-1: app/modules.ts installs exactly 10 modules", () => {
    const src = readFileSync("src/app/modules.ts", "utf8");
    expect(src.match(/\.use\(/g)).toHaveLength(10);
    expect(makeApp().build().registry.modules).toHaveLength(10);
  });

  it("AC-2: registry route paths equal the pre-refactor set", () => {
    const router = routerAt(makeApp(), "/");
    expect(Object.keys(router.routesByPath).sort()).toEqual(LEGACY_FULL_PATHS);
  });

  it("AC-2: '/' is now the index redirect route", () => {
    const router = routerAt(makeApp(), "/");
    expect(router.routesByPath["/"].id).toBe("/_index/");
  });

  it("keeps legacy route ids that pages pass to useParams({ from })", () => {
    const router = routerAt(makeApp(), "/");
    expect(router.routesById["/orders/$id"]).toBeDefined();
  });

  it("every page route carries its routeId (R19 / R23)", () => {
    const { registry } = makeApp().build();
    expect([...registry.routeIds].sort()).toEqual([
      "articles.create",
      "articles.edit",
      "articles.list",
      "auth.login",
      "banners.create",
      "banners.edit",
      "banners.list",
      "consumers.list",
      "orders.details",
      "orders.list",
      "product.create",
      "product.draft",
      "product.edit",
      "product.list",
      "suppliers.list",
      "tags.list",
      "team-members.list",
      "users.create",
      "users.edit",
      "users.list",
    ]);
  });

  it("sidebar items and order are unchanged", () => {
    const { registry } = makeApp().build();
    expect(
      registry.nav.map((n) => [n.labelKey, n.to, n.children?.map((c) => c.to)])
    ).toEqual([
      ["consumers.nav.title", "/customers", undefined],
      ["team-members.nav.title", "/team-members", undefined],
      ["suppliers.nav.title", "/suppliers", undefined],
      ["tags.nav.title", "/tags", undefined],
      ["product.nav.title", "/products", undefined],
      ["orders.nav.title", "/orders", ["/orders/order-list"]],
      ["banners.nav.title", "/banners", undefined],
      ["articles.nav.title", "/articles", undefined],
    ]);
  });

  it("AC-4: .override('users.list', Stub) renders Stub at the users list URL", async () => {
    const Stub = () => <div data-testid="stub-users-list" />;
    const router = routerAt(makeApp().override("users.list", Stub), "/users");
    render(<RouterProvider router={router} />);
    expect(await screen.findByTestId("stub-users-list")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", async () => {
    const router = routerAt(makeApp({ isAuthenticated: () => false }), "/tags");
    await router.load();
    expect(router.state.location.pathname).toBe("/login");
  });
});
