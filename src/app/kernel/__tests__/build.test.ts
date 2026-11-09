import { createRootRoute } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { defineModule } from "@/shared/module";
import { ForbiddenError } from "@/shared/permission";

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
  it("throws when nav references a declared resource with an undeclared action (full resource:action match)", () => {
    const navWith = (permission: `${string}:${string}`) =>
      mod("orders", {
        nav: [{ id: "o", label: "orders.nav", to: "/orders", permission }],
        permissions: { resources: { orders: ["read", "update", "export"] } },
      });
    expect(() => build(ctx([navWith("orders:typo")]))).toThrow(
      /"orders".*"orders:typo"/
    );
    expect(() => build(ctx([navWith("orders:read")]))).not.toThrow();
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
  it("throws when a page route has a routeId but no component", () => {
    const m = mod("orders", {
      routes: (c) => [
        c.page({
          getParentRoute: () => c.parent,
          path: "list",
          permission: "authenticated",
          routeId: rid("orders.list"),
        } as any),
      ],
    });
    expect(() => build(ctx([m]))).toThrow(
      /module "orders".*requires routeId and component/
    );
  });
  it("protected page from build() runs the permission guard in beforeLoad", () => {
    const m = mod("orders", {
      routes: (c) => [
        c.page({
          getParentRoute: () => c.parent,
          path: "list",
          permission: "orders:read",
          routeId: rid("orders.list"),
          component: page("x"),
        }),
      ],
    });
    const beforeLoadWith = (grants: string[]) => {
      const input = ctx([m]);
      input.core.getGrants = () => grants as any;
      const route = findByRouteId(build(input).routeTree, "orders.list");
      expect(route?.options.staticData).toMatchObject({
        permission: "orders:read",
      });
      return () => (route?.options as any).beforeLoad({});
    };
    expect(beforeLoadWith([])).toThrow(ForbiddenError);
    expect(beforeLoadWith(["orders:read"])).not.toThrow();
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

describe("permission catalog", () => {
  it("unions and dedupes actions when two modules declare the same resource", () => {
    const a = mod("a", {
      permissions: { resources: { orders: ["read", "update"] } },
      nav: [{ id: "n", label: "a.nav", to: "/a", permission: "orders:export" }],
    });
    const b = mod("b", {
      permissions: { resources: { orders: ["update", "export"] } },
      nav: [{ id: "m", label: "b.nav", to: "/b", permission: "orders:read" }],
    });
    const ops: TOperationTable = {
      routes: [
        { method: "GET", path: "/orders", operationId: "listOrders" },
        { method: "POST", path: "/orders/export", operationId: "exportOrders" },
      ],
      permissions: { listOrders: "orders:read", exportOrders: "orders:export" },
    };
    const { registry } = build(ctx([a, b], ops));
    expect(registry.permissions.orders).toEqual(["read", "update", "export"]);
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
  it("deep-merges a module whose id equals a core top-level key", () => {
    const common = mod("common", {
      i18n: {
        en: { cancel: "Cancel", save: "Module Save" },
        zh: { cancel: "取消" },
      },
    });
    const { registry } = build(ctx([common]));
    expect(registry.i18n.en).toEqual({
      common: { save: "Save", cancel: "Cancel" },
    });
    expect(registry.i18n.zh).toEqual({
      common: { save: "儲存", cancel: "取消" },
    });
  });
  it("keeps the core subtree when a same-name module has no i18n", () => {
    const { registry } = build(ctx([mod("common")]));
    expect(registry.i18n.en).toEqual({ common: { save: "Save" } });
    expect(registry.i18n.zh).toEqual({ common: { save: "儲存" } });
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

describe("i18n deep merge hardening", () => {
  const hasOwn = (o: object, k: string) =>
    Object.prototype.hasOwnProperty.call(o, k);
  const withCore = (en: Record<string, unknown>, modules: TModule[]) => {
    const core = makeCore();
    core.i18n = { en, zh: {} } as any;
    return build(ctx(modules, emptyOps, { core })).registry.i18n.en as any;
  };

  it("writes __proto__ keys as own properties without touching prototypes", () => {
    const en = JSON.parse(
      '{"common":{"save":"Save","__proto__":{"x":"core"}},"__proto__":{"top":"core"}}'
    );
    const common = mod("common", {
      i18n: { en: { cancel: "Cancel" }, zh: {} },
    });
    const out = withCore(en, [common]);
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(out.common)).toBe(Object.prototype);
    expect(hasOwn(out, "__proto__")).toBe(true);
    expect(hasOwn(out.common, "__proto__")).toBe(true);
    expect(Object.getOwnPropertyDescriptor(out, "__proto__")?.value).toEqual({
      top: "core",
    });
    expect(
      Object.getOwnPropertyDescriptor(out.common, "__proto__")?.value
    ).toEqual({ x: "core" });
    expect(out.common.cancel).toBe("Cancel");
    expect(out.common.save).toBe("Save");
    expect(({} as any).x).toBeUndefined();
    expect(({} as any).top).toBeUndefined();
  });

  it("deep-merges __proto__ subtrees present on both sides as own data", () => {
    const en = JSON.parse('{"common":{"__proto__":{"x":"core"}}}');
    const common = mod("common", {
      i18n: { en: JSON.parse('{"__proto__":{"x":"mod","y":"mod"}}'), zh: {} },
    });
    const out = withCore(en, [common]);
    expect(Object.getPrototypeOf(out.common)).toBe(Object.prototype);
    expect(
      Object.getOwnPropertyDescriptor(out.common, "__proto__")?.value
    ).toEqual({ x: "core", y: "mod" });
    expect(({} as any).y).toBeUndefined();
  });

  it("keeps a core Date leaf when the module has an object at the same path", () => {
    const when = new Date(0);
    const common = mod("common", {
      i18n: { en: { when: { label: "mod" } }, zh: {} },
    });
    const out = withCore({ common: { when } }, [common]);
    expect(out.common.when).toBe(when);
  });

  it("keeps a core class instance leaf with its prototype and methods", () => {
    class Greeter {
      constructor(public name: string) {}
      hi() {
        return `hi ${this.name}`;
      }
    }
    const g = new Greeter("core");
    const common = mod("common", {
      i18n: { en: { greeter: { name: "mod", extra: 1 } }, zh: {} },
    });
    const out = withCore({ common: { greeter: g } }, [common]);
    expect(out.common.greeter).toBe(g);
    expect(out.common.greeter.hi()).toBe("hi core");
  });

  it("resolves nested multi-level conflicts with core leaf priority", () => {
    const d = new Date(1);
    const common = mod("common", {
      i18n: {
        en: { a: { b: { c: "mod", d: { x: 1 }, e: "mod" }, f: "mod" } },
        zh: {},
      },
    });
    const out = withCore(
      { common: { a: { b: { c: "core", d }, g: ["core"] } } },
      [common]
    );
    expect(out).toEqual({
      common: { a: { b: { c: "core", d, e: "mod" }, f: "mod", g: ["core"] } },
    });
    expect(out.common.a.b.d).toBe(d);
  });

  it("does not mutate core or module input dicts", () => {
    const en = { common: { save: "Save", nested: { a: "core" } } };
    const modEn = { cancel: "Cancel", nested: { a: "mod", b: "mod" } };
    const snapCore = JSON.stringify(en);
    const snapMod = JSON.stringify(modEn);
    const out = withCore(en, [mod("common", { i18n: { en: modEn, zh: {} } })]);
    expect(out.common.nested).toEqual({ a: "core", b: "mod" });
    expect(JSON.stringify(en)).toBe(snapCore);
    expect(JSON.stringify(modEn)).toBe(snapMod);
  });
});
