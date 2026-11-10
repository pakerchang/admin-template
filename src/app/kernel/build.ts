/* eslint-disable @typescript-eslint/no-explicit-any -- route opts 經 runtime 驗證，型別由 shared/module 的 helper 型別把關 */
import { createRoute, redirect } from "@tanstack/react-router";
import { createElement } from "react";

import { createForbiddenBoundary } from "@/app/router/forbidden-boundary";
import { createIndexRedirect } from "@/app/router/index-redirect";
import { setGrantSchema } from "@/shared/api/session";
import { NavContext } from "@/shared/module";
import {
  corePermissions,
  GrantsContext,
  grantSchema,
  guardedRoute,
} from "@/shared/permission";

import type {
  TLocale,
  TModule,
  TNavItem,
  TPublicRouteContext,
  TRouteContext,
  TRouteId,
  TShell,
} from "@/shared/module";
import type {
  TGrant,
  TGrantMatrix,
  TOperationTable,
  TPermissionCatalog,
} from "@/shared/permission";
import type { AnyRootRoute, AnyRoute } from "@tanstack/react-router";
import type { HttpHandler } from "msw";
import type { ComponentType } from "react";

type TI18n = Record<TLocale, Record<string, unknown>>;

/** kernel 自有、由 app 層提供的零件（root route、core 字典、MSW handler factory、session grants） */
export type TCore = {
  root: AnyRootRoute;
  i18n: TI18n;
  /**
   * kernel 的 MSW handler：[guard, ...core handler]，guard 必在第一位（§4.3 步驟 5）。
   * mockGrants = 已安裝 module 的 `permissions.mockGrants`：login 回傳的 session.grants 與 guard 的 token → grants 都依它展開
   */
  mock: (
    opts: TOperationTable & {
      apiBaseUrl: string;
      mockGrants: readonly TGrantMatrix[];
    }
  ) => HttpHandler[];
  getGrants: () => readonly TGrant[];
  /** 登入守衛：未登入進 protected → /login；已登入進 auth → "/"。省略 = 不守衛（測試 fixture） */
  isAuthenticated?: () => boolean;
};

export type TBuildInput = {
  modules: readonly TModule[];
  shell: TShell;
  overrides: ReadonlyMap<TRouteId, ComponentType<any>>;
  operations: TOperationTable;
  apiBaseUrl: string;
  core: TCore;
};

export type TRegistry = {
  modules: readonly TModule[];
  /** 依 order 排序、未過濾 */
  nav: TNavItem[];
  permissions: TPermissionCatalog;
  operations: TOperationTable;
  routeIds: ReadonlySet<TRouteId>;
  /** [guard, ...core, ...modules] */
  mockHandlers: HttpHandler[];
  /** 已依 module id scope 後的合併結果 */
  i18n: TI18n;
};

const resourceOf = (p: string) => p.slice(0, p.indexOf(":"));

const assertUniqueIds = (modules: readonly TModule[]) => {
  const seen = new Set<string>();
  for (const { id } of modules) {
    if (seen.has(id)) throw new Error(`duplicate module id "${id}"`);
    seen.add(id);
  }
};

const assertRequires = (modules: readonly TModule[]) => {
  const byId = new Map(modules.map((m) => [m.id, m]));
  for (const m of modules)
    for (const dep of m.requires ?? [])
      if (!byId.has(dep))
        throw new Error(
          `module "${m.id}" requires "${dep}" but it is not installed`
        );

  const done = new Set<string>();
  const visit = (id: string, path: string[]) => {
    if (path.includes(id))
      throw new Error(
        `module requires cycle: ${[...path.slice(path.indexOf(id)), id].join(
          " -> "
        )}`
      );
    if (done.has(id)) return;
    for (const dep of byId.get(id)?.requires ?? []) visit(dep, [...path, id]);
    done.add(id);
  };
  for (const m of modules) visit(m.id, []);
};

const assertI18nBare = (modules: readonly TModule[]) => {
  for (const m of modules)
    for (const [lng, dict] of Object.entries(m.i18n ?? {}))
      if (m.id in dict)
        throw new Error(
          `module "${m.id}": i18n.${lng} must be a bare dictionary (top-level key "${m.id}" found; kernel scopes it)`
        );
};

const catalog = (modules: readonly TModule[]): TPermissionCatalog => {
  // kernel 自有 resource：§6.1 core `app:access`（R29 core operation 與 profile 也引用它）
  const out: Record<string, string[]> = { app: ["access"] };
  for (const m of modules)
    for (const [resource, actions] of Object.entries(
      m.permissions?.resources ?? {}
    ))
      out[resource] = [...new Set([...(out[resource] ?? []), ...actions])];
  return out;
};

/** 完整 `resource:action` 是否在已安裝 module 的權限目錄內（R21） */
const inCatalog = (catalogue: TPermissionCatalog, p: string) =>
  !!catalogue[resourceOf(p)]?.includes(p.slice(p.indexOf(":") + 1));

/** §4.3 1.4：nav permission 必須是已安裝 module 權限目錄中完整的 `resource:action`（owner 2026-11-09 nav 粒度裁決） */
const assertNavPermissions = (
  modules: readonly TModule[],
  catalogue: TPermissionCatalog
) => {
  for (const m of modules)
    for (const item of (m.nav ?? []).flatMap((n) => [n, ...(n.children ?? [])]))
      if (!inCatalog(catalogue, item.permission))
        throw new Error(
          `module "${m.id}": nav "${item.id}" permission "${item.permission}" is not in any installed module's permission catalog`
        );
};

/** §4.3 1.5（R13 / R21，fail-closed） */
const assertOperations = (
  { routes, permissions }: TOperationTable,
  catalogue: TPermissionCatalog
) => {
  const routeIds = new Set(routes.map((r) => r.operationId));
  for (const { operationId } of routes)
    if (!(operationId in permissions))
      throw new Error(
        `operation "${operationId}" has no permission declared (use "public" explicitly)`
      );
  for (const operationId of Object.keys(permissions))
    if (!routeIds.has(operationId))
      throw new Error(
        `operation "${operationId}" has a permission declared but no route`
      );
  for (const [operationId, p] of Object.entries(permissions)) {
    if (p === "public") continue;
    if (p.includes("*"))
      throw new Error(
        `operation "${operationId}" requires "${p}": wildcard is not allowed in operation permissions`
      );
    if (!inCatalog(catalogue, p))
      throw new Error(
        `operation "${operationId}" requires "${p}" which is not in any installed module's permission catalog`
      );
  }
  const seen = new Set<string>();
  for (const { method, path } of routes) {
    const key = `${method.toUpperCase()} ${path}`;
    if (seen.has(key)) throw new Error(`duplicate operation route "${key}"`);
    seen.add(key);
  }
};

/** 只有 plain object 會被遞迴；Date / class instance / 陣列 / 函式 / null 皆為 leaf */
const isPlainDict = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== "object" || v === null) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

/** 遞迴合併；leaf 衝突時 `winner` 勝。own-property 讀寫，`__proto__` 等特殊鍵不觸發 setter */
const mergeDeep = (
  base: Record<string, unknown>,
  winner: Record<string, unknown>
): Record<string, unknown> => {
  const out = { ...base };
  for (const [k, v] of Object.entries(winner)) {
    const cur = Object.prototype.hasOwnProperty.call(out, k)
      ? out[k]
      : undefined;
    Object.defineProperty(out, k, {
      value: isPlainDict(cur) && isPlainDict(v) ? mergeDeep(cur, v) : v,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return out;
};

/** §4.3 步驟 4：module 字典 scope 到 module id 後與 core 深層合併；core 既有 key 不被覆蓋（AC-4） */
const scopeAndMerge = (core: TI18n, modules: readonly TModule[]): TI18n =>
  Object.fromEntries(
    Object.entries(core).map(([lng, dict]) => [
      lng,
      mergeDeep(
        Object.fromEntries(
          modules.map((m) => [m.id, m.i18n?.[lng as TLocale] ?? {}])
        ),
        dict
      ),
    ])
  ) as TI18n;

export function build({
  modules,
  shell,
  overrides,
  operations,
  apiBaseUrl,
  core,
}: TBuildInput) {
  assertUniqueIds(modules);
  assertRequires(modules);
  assertI18nBare(modules);
  const catalogue = catalog(modules);
  assertNavPermissions(modules, catalogue);
  assertOperations(operations, catalogue);
  // T1 AC-5：session.grants 邊界 schema 依已 .use() 的 module 組出
  setGrantSchema(
    grantSchema([
      corePermissions.catalog,
      ...modules.flatMap((m) => (m.permissions ? [m.permissions.catalog] : [])),
    ])
  );

  // Array#sort 是穩定排序（ES2019）
  const nav = modules
    .flatMap((m) => m.nav ?? [])
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

  // 內部用 string：TRouteId 在無 module augment 時為 never
  const routeIds = new Set<string>();
  const resolvePage = (id: string, Default: ComponentType<any>) =>
    overrides.get(id as TRouteId) ?? shell.pages?.[id as TRouteId] ?? Default;
  const label = (opts: any) => opts.path ?? opts.id;

  // §4.3 1.8：ctx.layout 不得帶 component
  const layoutFor =
    (moduleId: string, make: (opts: any) => AnyRoute) => (opts: any) => {
      if (opts.component)
        throw new Error(
          `module "${moduleId}": layout route "${label(
            opts
          )}" must not have a component (use ctx.page)`
        );
      return make(opts);
    };

  // §4.3 1.7 / 1.8：ctx.page 必有 routeId + component；routeId 不重複、前綴 = 所屬 module id（R23）
  const pageFor =
    (moduleId: string, make: (opts: any) => AnyRoute) => (opts: any) => {
      const { routeId, ...rest } = opts;
      if (!routeId || !opts.component)
        throw new Error(
          `module "${moduleId}": page route "${label(
            opts
          )}" requires routeId and component`
        );
      const prefix = `${moduleId}.`;
      if (!routeId.startsWith(prefix) || routeId.length === prefix.length)
        throw new Error(
          `module "${moduleId}": route id "${routeId}" must be "${prefix}<name>" (R23)`
        );
      if (routeIds.has(routeId))
        throw new Error(
          `module "${moduleId}": duplicate route id "${routeId}"`
        );
      routeIds.add(routeId);
      return make({
        ...rest,
        staticData: { ...opts.staticData, routeId },
        component: resolvePage(routeId, opts.component),
      });
    };

  // §6.2 / R10：module route 無權限 → ForbiddenError → 內容區 shell.Forbidden（URL、shell 保留）
  const ForbiddenBoundary = createForbiddenBoundary(shell.Forbidden);
  const guarded = (opts: any) =>
    guardedRoute(
      { ...opts, errorComponent: ForbiddenBoundary },
      core.getGrants
    );
  const plain = (opts: any) => createRoute(opts) as AnyRoute;

  // shell 只經 useVisibleNav() / useCan() 取 nav 與 grants（§6.3、§6.4）；Provider 包在 protected layout 外
  const ProtectedRoot = () =>
    createElement(
      GrantsContext.Provider,
      { value: core.getGrants },
      createElement(
        NavContext.Provider,
        { value: nav },
        createElement(shell.ProtectedLayout)
      )
    );

  const isAuthenticated = core.isAuthenticated;
  const authRoute = createRoute({
    getParentRoute: () => core.root,
    id: "_auth",
    component: shell.AuthLayout as any,
    beforeLoad: () => {
      if (isAuthenticated?.()) throw redirect({ to: "/" });
    },
  });
  // pathless 但 id 取 "/"：子 route id 維持 "/orders/$id" 形狀（頁面以 useParams({ from }) 依賴它）。
  // 不用 path "/"：@tanstack/react-router 1.170 下 path "/" 的 route 比對不到任何子路徑。
  const protectedRoute = createRoute({
    getParentRoute: () => core.root,
    id: "/",
    component: ProtectedRoot,
    staticData: { permission: "authenticated" },
    beforeLoad: () => {
      if (isAuthenticated && !isAuthenticated())
        throw redirect({ to: "/login" });
    },
  } as any);

  const routeTree = core.root.addChildren([
    authRoute.addChildren(
      modules.flatMap(
        (m) =>
          m.publicRoutes?.({
            parent: authRoute,
            layout: layoutFor(m.id, plain),
            page: pageFor(m.id, plain),
          } as TPublicRouteContext) ?? []
      )
    ),
    protectedRoute.addChildren([
      createIndexRedirect(protectedRoute, nav, core.getGrants, shell.Forbidden),
      ...modules.flatMap(
        (m) =>
          m.routes?.({
            parent: protectedRoute,
            layout: layoutFor(m.id, guarded),
            page: pageFor(m.id, guarded),
          } as TRouteContext) ?? []
      ),
    ]),
  ]);

  // §4.3 1.6：所有 module routes 建完後才檢查
  for (const id of overrides.keys())
    if (!routeIds.has(id))
      throw new Error(`override: unknown route id "${id}"`);

  const registry: TRegistry = {
    modules,
    nav,
    operations,
    routeIds: routeIds as unknown as ReadonlySet<TRouteId>,
    permissions: catalogue,
    i18n: scopeAndMerge(core.i18n, modules),
    mockHandlers: [
      ...core.mock({
        ...operations,
        apiBaseUrl,
        mockGrants: modules.flatMap((m) =>
          m.permissions?.mockGrants ? [m.permissions.mockGrants] : []
        ),
      }),
      ...modules.flatMap((m) => m.mockHandlers ?? []),
    ],
  };
  return { routeTree, registry };
}
