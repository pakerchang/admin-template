import { createRootRoute } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { defineModule } from "@/shared/module";

import { build } from "../build";
import { createApp } from "../create-app";

import type { TBuildInput } from "../build";
import type { TModule, TRouteId, TShell } from "@/shared/module";
import type {
  OperationPermissions,
  TOperationTable,
} from "@/shared/permission";
import type { AnyRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const mod = (id: string, extra: Partial<TModule> = {}) =>
  defineModule({ id, kind: "domain", ...extra });

const rid = (id: string) => id as TRouteId;
const page = (testId: string): ComponentType =>
  function Page() {
    return createElement("div", { "data-testid": testId });
  };

const fakeGuard = { kind: "guard" } as any;

const shell: TShell = {
  id: "test",
  ProtectedLayout: () => null,
  AuthLayout: () => null,
  Forbidden: () => null,
};

const makeCore = () => ({
  root: createRootRoute(),
  i18n: {
    en: { common: { save: "Save" } },
    zh: { common: { save: "儲存" } },
  },
  guard: vi.fn(() => fakeGuard),
  mockHandlers: [{ kind: "core" } as any],
  getGrants: () => [],
});

const emptyOps: TOperationTable = { routes: [], permissions: {} };

const ctx = (
  modules: TModule[],
  operations: TOperationTable = emptyOps,
  extra: Partial<TBuildInput> = {}
): TBuildInput => ({
  modules,
  shell,
  overrides: new Map<TRouteId, ComponentType>(),
  operations,
  apiBaseUrl: "http://api.test",
  core: makeCore(),
  ...extra,
});

const allRoutes = (route: AnyRoute): AnyRoute[] => [
  route,
  ...((route.children as AnyRoute[] | undefined) ?? []).flatMap(allRoutes),
];
const findByRouteId = (tree: AnyRoute, id: string) =>
  allRoutes(tree).find((r) => r.options.staticData?.routeId === id);
const renderRoute = (tree: AnyRoute, id: string) => {
  const component = findByRouteId(tree, id)?.options.component;
  render(createElement(component as ComponentType));
};

/** module with one layout + N pages, each page's default component renders `default:<routeId>` */
const pagesModule = (id: string, routeIds: string[], extra = {}) =>
  mod(id, {
    routes: (c) => {
      const base = c.layout({
        getParentRoute: () => c.parent,
        path: id,
        permission: "authenticated",
      });
      return [
        base.addChildren(
          routeIds.map((r) =>
            c.page({
              getParentRoute: () => base,
              path: r.split(".").pop(),
              permission: "authenticated",
              routeId: rid(r),
              component: page(`default:${r}`),
            })
          )
        ),
      ];
    },
    ...extra,
  });

describe("build() validation", () => {
  it("throws on duplicate module id", () => {
    expect(() => build(ctx([mod("a"), mod("a")]))).toThrow(
      /duplicate module id "a"/
    );
  });
  it("fails fast when a required module is not installed", () => {
    expect(() =>
      build(ctx([mod("product", { requires: ["suppliers"] })]))
    ).toThrow(/"product" requires "suppliers"/);
  });
  it("throws on requires cycle", () => {
    expect(() =>
      build(ctx([mod("a", { requires: ["b"] }), mod("b", { requires: ["a"] })]))
    ).toThrow(/cycle/);
  });
  it("accepts an acyclic requires graph regardless of .use() order", () => {
    expect(() =>
      build(
        ctx([
          mod("product", { requires: ["suppliers", "tags"] }),
          mod("suppliers", { requires: ["tags"] }),
          mod("tags"),
        ])
      )
    ).not.toThrow();
  });
  it("throws when a module i18n dict is pre-scoped (top-level key === id)", () => {
    const pre = mod("orders", {
      i18n: { en: { orders: {} }, zh: { orders: {} } },
    });
    expect(() => build(ctx([pre]))).toThrow(/"orders".*bare dictionary/);
  });
  it("throws when nav references an undeclared resource", () => {
    const m = mod("orders", {
      nav: [
        { id: "o", label: "orders.nav", to: "/orders", permission: "x:read" },
      ],
      permissions: { resources: { orders: ["read"] } },
    });
    expect(() => build(ctx([m]))).toThrow(/"orders".*"x:read"/);
  });
  it("checks nav children resources too", () => {
    const m = mod("orders", {
      nav: [
        {
          id: "o",
          label: "orders.nav",
          to: "/orders",
          permission: "orders:read",
          children: [
            { id: "c", label: "orders.c", to: "/c", permission: "y:read" },
          ],
        },
      ],
      permissions: { resources: { orders: ["read"] } },
    });
    expect(() => build(ctx([m]))).toThrow(/"orders".*"y:read"/);
  });
});

describe("operation table (fail-closed)", () => {
  const ops = (permissions: OperationPermissions): TOperationTable => ({
    routes: [
      { method: "GET", path: "/a", operationId: "listA" },
      { method: "POST", path: "/login", operationId: "login" },
    ],
    permissions,
  });
  const a = mod("a", { permissions: { resources: { a: ["read"] } } });
  it("throws on an operation without declared permission", () => {
    expect(() => build(ctx([a], ops({ listA: "a:read" })))).toThrow(
      /operation "login" has no permission declared.*"public"/
    );
  });
  it("accepts explicit public", () => {
    expect(() =>
      build(ctx([a], ops({ listA: "a:read", login: "public" })))
    ).not.toThrow();
  });
  it("throws on orphan permission key", () => {
    expect(() =>
      build(
        ctx([a], ops({ listA: "a:read", login: "public", ghost: "a:read" }))
      )
    ).toThrow(/"ghost"/);
  });
  it("throws when a permission resource is not declared by an installed module", () => {
    expect(() =>
      build(ctx([], ops({ listA: "a:read", login: "public" })))
    ).toThrow(/"a:read".*not in any installed module's permission catalog/);
  });
  it("throws on a typo action even when the resource exists (R21 full resource:action match)", () => {
    expect(() =>
      build(ctx([a], ops({ listA: "a:typo", login: "public" })))
    ).toThrow(/"listA".*"a:typo"/);
  });
  it("orders:typo fails, orders:read passes against orders catalog", () => {
    const orders = mod("orders", {
      permissions: { resources: { orders: ["read", "update", "export"] } },
    });
    const table = (p: OperationPermissions): TOperationTable => ({
      routes: [
        { method: "GET", path: "/admin/orders", operationId: "listOrders" },
      ],
      permissions: p,
    });
    expect(() =>
      build(ctx([orders], table({ listOrders: "orders:typo" })))
    ).toThrow(/"listOrders".*"orders:typo"/);
    expect(() =>
      build(ctx([orders], table({ listOrders: "orders:read" })))
    ).not.toThrow();
  });
  it("throws on wildcard operation permission", () => {
    const table: TOperationTable = {
      routes: [{ method: "GET", path: "/a", operationId: "listA" }],
      permissions: { listA: "a:*" },
    };
    expect(() => build(ctx([a], table))).toThrow(/"listA".*wildcard/);
  });
  it("throws on duplicate method + path", () => {
    const table: TOperationTable = {
      routes: [
        { method: "GET", path: "/a", operationId: "listA" },
        { method: "get", path: "/a", operationId: "listA2" },
      ],
      permissions: { listA: "public", listA2: "public" },
    };
    expect(() => build(ctx([a], table))).toThrow(
      /duplicate operation route "GET \/a"/
    );
  });
});

describe("page / layout routes (F5)", () => {
  it("throws when a page route has a component but no routeId", () => {
    const m = mod("orders", {
      routes: (c) => [
        c.page({
          getParentRoute: () => c.parent,
          path: "list",
          permission: "authenticated",
          component: page("x"),
        } as any),
      ],
    });
    expect(() => build(ctx([m]))).toThrow(/module "orders".*requires routeId/);
  });
  it("throws when a layout route has a component", () => {
    const m = mod("orders", {
      routes: (c) => [
        c.layout({
          getParentRoute: () => c.parent,
          path: "orders",
          permission: "authenticated",
          component: page("x"),
        } as any),
      ],
    });
    expect(() => build(ctx([m]))).toThrow(
      /module "orders".*must not have a component/
    );
  });
  it("applies the same checks to publicRoutes", () => {
    const m = mod("auth", {
      publicRoutes: (c) => [
        c.page({
          getParentRoute: () => c.parent,
          path: "login",
          component: page("x"),
        } as any),
      ],
    });
    expect(() => build(ctx([m]))).toThrow(/module "auth".*requires routeId/);
  });
});

describe("route id override resolution", () => {
  it("app override > shell.pages > module default", () => {
    const m = pagesModule("x", ["x.a", "x.b", "x.c"]);
    const app = createApp({
      shell: {
        ...shell,
        pages: {
          [rid("x.a")]: page("shell:x.a"),
          [rid("x.b")]: page("shell:x.b"),
        },
      },
      operations: emptyOps,
      apiBaseUrl: "http://api.test",
      core: makeCore(),
    })
      .use(m)
      .override(rid("x.a"), page("app:x.a"));
    const { routeTree } = app.build();

    renderRoute(routeTree, "x.a");
    renderRoute(routeTree, "x.b");
    renderRoute(routeTree, "x.c");
    expect(screen.getByTestId("app:x.a")).toBeInTheDocument();
    expect(screen.getByTestId("shell:x.b")).toBeInTheDocument();
    expect(screen.getByTestId("default:x.c")).toBeInTheDocument();
    expect(screen.queryByTestId("shell:x.a")).toBeNull();
    expect(screen.queryByTestId("default:x.a")).toBeNull();
  });
  it("throws on unknown app override route id", () => {
    const overrides = new Map([[rid("x.nope"), page("p")]]);
    expect(() =>
      build(ctx([pagesModule("x", ["x.a"])], emptyOps, { overrides }))
    ).toThrow(/override: unknown route id "x.nope"/);
  });
  it("ignores unknown shell.pages id", () => {
    const s = { ...shell, pages: { [rid("ghost.list")]: page("g") } };
    expect(() =>
      build(ctx([pagesModule("x", ["x.a"])], emptyOps, { shell: s }))
    ).not.toThrow();
  });
  it("throws on duplicate routeId", () => {
    expect(() => build(ctx([pagesModule("x", ["x.a", "x.a"])]))).toThrow(
      /duplicate route id "x.a"/
    );
  });
  it("throws on routeId without own module prefix (R23)", () => {
    expect(() => build(ctx([pagesModule("x", ["y.a"])]))).toThrow(
      /module "x".*"y.a".*"x\.<name>"/
    );
    expect(() => build(ctx([pagesModule("x", ["x."])]))).toThrow(
      /module "x".*"x\."/
    );
  });
  it("registry.routeIds equals the declared routeId set", () => {
    const { registry } = build(
      ctx([pagesModule("x", ["x.a", "x.b"]), pagesModule("y", ["y.list"])])
    );
    expect([...registry.routeIds].sort()).toEqual(["x.a", "x.b", "y.list"]);
  });
});

describe("assembly (AC-4)", () => {
  const navItem = (id: string, order?: number) => ({
    id,
    label: `${id}.nav`,
    to: `/${id}`,
    permission: "r:read" as const,
    order,
  });
  const resources = { permissions: { resources: { r: ["read"] } } };

  it("route tree contains both modules' child routes", () => {
    const { routeTree } = build(
      ctx([pagesModule("x", ["x.a"], resources), pagesModule("y", ["y.b"])])
    );
    expect(findByRouteId(routeTree, "x.a")).toBeDefined();
    expect(findByRouteId(routeTree, "y.b")).toBeDefined();
    const paths = allRoutes(routeTree).map((r) => (r.options as any).path);
    expect(paths).toEqual(expect.arrayContaining(["x", "a", "y", "b"]));
  });
  it("nav is stably sorted by order (default 100)", () => {
    const { registry } = build(
      ctx([
        mod("m1", { nav: [navItem("n1"), navItem("n2", 5)], ...resources }),
        mod("m2", { nav: [navItem("n3", 100), navItem("n4", 1)] }),
      ])
    );
    expect(registry.nav.map((n) => n.id)).toEqual(["n4", "n2", "n1", "n3"]);
  });
  it("mockHandlers[0] is the guard built from operations + apiBaseUrl", () => {
    const input = ctx([mod("m", { mockHandlers: [{ kind: "m" } as any] })]);
    const { registry } = build(input);
    expect(registry.mockHandlers[0]).toBe(fakeGuard);
    expect(registry.mockHandlers).toHaveLength(3);
    expect(input.core.guard).toHaveBeenCalledWith({
      ...emptyOps,
      apiBaseUrl: "http://api.test",
    });
  });
});

describe("i18n scope", () => {
  it("scopes bare module dict under module id exactly once", () => {
    const o = mod("orders", {
      i18n: {
        en: { list: { title: "Orders" } },
        zh: { list: { title: "訂單" } },
      },
    });
    const { registry } = build(ctx([o]));
    const en = registry.i18n.en as any;
    expect(en.orders.list.title).toBe("Orders");
    expect(en.orders.orders).toBeUndefined();
    expect((registry.i18n.zh as any).orders.list.title).toBe("訂單");
  });
  it("keeps core keys", () => {
    const o = mod("orders", {
      i18n: {
        en: { list: { title: "Orders" } },
        zh: { list: { title: "訂單" } },
      },
    });
    const { registry } = build(ctx([o]));
    expect((registry.i18n.en as any).common.save).toBe("Save");
  });
});
