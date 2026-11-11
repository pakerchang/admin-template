/* eslint-disable @typescript-eslint/no-explicit-any -- ComponentType<any>：照 spec §4.1 草案 */
import type { TModulePermissions, TPermission } from "@/shared/permission";
import type { AnyRoute } from "@tanstack/react-router";
import type { HttpHandler } from "msw";
import type { ComponentType } from "react";

export type TLocale = "en" | "zh";

/** R19：route id = 可覆寫的 page id。module 以 declaration merging 擴充；格式 `${moduleId}.${name}`（R23） */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TRouteIdRegistry {}
export type TRouteId = Extract<keyof TRouteIdRegistry, string>;
/** R23：只屬於 module `Id` 的 route id（`${Id}.${name}`） */
export type TOwnRouteId<Id extends string> = Extract<
  TRouteId,
  `${Id}.${string}`
>;

/** module id registry：每個 module 在 index.ts augment `{ <id>: true }`（typed-contracts T2 §2.1）；不得帶 index signature */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TModuleIdRegistry {}
export type TModuleId = Extract<keyof TModuleIdRegistry, string>;

/**
 * nav / routeTitles 可用的靜態完整路徑（無 `$param`、無結尾斜線；T2 §2.3）。
 * module 在 model/routes.ts augment；core 自帶 `"/"`（protected index），registry 永不為 never
 */
export interface TRoutePathRegistry {
  "/": true;
}
export type TRoutePath = Extract<keyof TRoutePathRegistry, string>;

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    permission?: TPermission | "authenticated";
    /** kernel 由 ctx.page 的 routeId 注入（執行期 metadata） */
    routeId?: TRouteId;
  }
}

type TNavBase = {
  id: string;
  /** 已登錄的靜態絕對路徑（跨 module 導航只經 nav 字串；build() 另驗實際 route 存在） */
  to: TRoutePath;
  icon?: ComponentType<{ className?: string }>;
  /** 必填，nav 過濾依據（§6.3） */
  permission: TPermission;
  /** 排序，預設 100 */
  order?: number;
};
type TNavNode<TLabel> = Omit<TNavBase, "icon"> & TLabel;
type TNavTree<TLabel> = TNavBase & TLabel & { children?: TNavNode<TLabel>[] };

/**
 * module 宣告的 nav 項目。`label` 是 module 字典 `nav` 段的**局部 key**（例 `"title"`）；
 * kernel 組 `${id}.nav.${label}`（i18n-scope-migration 補裁 2）。`defineModule` 會把 L 收窄成字典實際有的 key
 */
export type TNavItem<L extends string = string> = TNavTree<{ label: L }>;

/** 沒有 nav 的 route 標題（只供 breadcrumb，不進 sidebar；補裁 4）。label 同 nav 局部 key */
export type TRouteTitle<L extends string = string> = {
  to: TRoutePath;
  label: L;
};

/** registry 內部的 nav 項目：kernel 以組好的全域 key 取代局部 label（不外流到 shell） */
export type TRegistryNavItem = TNavTree<{ labelKey: string }>;

/** shell 拿到的 nav 項目：label 是已翻譯文字、不含任何 key 欄位（補裁 3） */
export type TResolvedNavItem = TNavTree<{ label: string }>;

/** F5：layout route 與 page route 用兩個 typed helper 區分 */
type TGuard = { permission: TPermission | "authenticated" };
export type TLayoutRouteOpts<TOpts> = TOpts &
  TGuard & {
    /** layout route 不得有畫面（只做路徑分組，渲染 <Outlet />） */
    component?: never;
    routeId?: never;
  };
export type TPageRouteOpts<TOpts, Id extends string = TModuleId> = TOpts &
  TGuard & {
    /** 必填：有畫面就必須可覆寫（D1）；格式 `${moduleId}.${name}`，前綴只能是所屬 module（R23） */
    routeId: TOwnRouteId<Id>;
    /** 必填：module 預設頁面（由 index.ts 注入，§4.4） */
    component: ComponentType<any>;
  };

/** Id = 所屬 module；預設（全部 module）只給 kernel 與寬型別 TModule 用 */
export type TRouteContext<Id extends TModuleId = TModuleId> = {
  /** protected layout route */
  parent: AnyRoute;
  /** kernel 注入：runtime 帶 component → build() throw */
  layout: <TOpts>(opts: TLayoutRouteOpts<TOpts>) => AnyRoute;
  /** kernel 注入：runtime 缺 routeId 或 component → build() throw */
  page: <TOpts>(opts: TPageRouteOpts<TOpts, Id>) => AnyRoute;
};

/** publicRoutes（例：/login）也要能覆寫，同樣只給 page / layout helper，但不掛 permission guard */
export type TPublicRouteContext<Id extends TModuleId = TModuleId> = {
  /** auth layout route */
  parent: AnyRoute;
  layout: <TOpts>(
    opts: TOpts & { component?: never; routeId?: never }
  ) => AnyRoute;
  page: <TOpts>(
    opts: TOpts & { routeId: TOwnRouteId<Id>; component: ComponentType<any> }
  ) => AnyRoute;
};

export type TModule = {
  /** kebab-case，唯一；須在 TModuleIdRegistry 登錄 */
  id: TModuleId;
  /** D4 驗收腳本依此挑出 domain */
  kind: "generic" | "domain";
  /** R8：依賴的 module id；缺 → build() fail fast */
  requires?: readonly TModuleId[];
  routes?: (ctx: TRouteContext) => AnyRoute[];
  publicRoutes?: (ctx: TPublicRouteContext) => AnyRoute[];
  nav?: TNavItem[];
  /** 沒有 nav 的 route 宣告 breadcrumb 標題（補裁 4） */
  routeTitles?: readonly TRouteTitle[];
  /** 裸字典（不含 module id 頂層）；kernel 以 { [id]: dict } scope（§4.3、§5.4） */
  i18n?: TModuleI18n;
  /** R11：MSW handler */
  mockHandlers?: HttpHandler[];
  /** R21：權限目錄 resources + 角色預設 grant mockGrants */
  permissions?: TModulePermissions;
};

type TModuleI18n = Record<TLocale, Record<string, unknown>>;
type TStringKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : never;
}[keyof T & string];
type TNavKeysOf<D> = D extends { nav: infer N } ? TStringKeys<N> : never;
/** en 與 zh 字典 `nav` 段共同的 string leaf key；無 i18n / 無 nav 段 → never */
export type TNavLocalKey<I> = I extends { en: infer E; zh: infer Z }
  ? TNavKeysOf<E> & TNavKeysOf<Z>
  : never;

/**
 * 純型別輔助：nav / routeTitles 的 label 收窄成 module 自己字典 `nav` 段的局部 key（AC-4 (2)）。
 * i18n（I）與 label（L）拆成獨立型別參數：module 的 `routes: (ctx) => …` 是 context-sensitive 函式，
 * 只靠 M 推導時 TS 會先固定 M、label 推導退化成 never（實測）
 */
export const defineModule = <
  const M extends Omit<TModule, "routes" | "publicRoutes">,
  const Id extends TModuleId,
  const I extends TModuleI18n = never,
  const L extends TNavLocalKey<I> = never,
>(
  m: M & {
    id: Id;
    i18n?: I;
    nav?: TNavItem<L>[];
    routeTitles?: readonly TRouteTitle<L>[];
    /** 不得 requires 自己（T2 §2.1） */
    requires?: readonly Exclude<TModuleId, Id>[];
    /** route id 前綴只能是自己的 id（R23，OD-T2-2 B） */
    routes?: (ctx: TRouteContext<Id>) => AnyRoute[];
    publicRoutes?: (ctx: TPublicRouteContext<Id>) => AnyRoute[];
  }
): M => m;

/** 型別住 shared，讓 shells 不必 import app（§4.2） */
export type TShell = {
  id: string;
  /** 內含 <Outlet />，內容區負責顯示 403（§6.2） */
  ProtectedLayout: ComponentType;
  /** 內含 <Outlet /> */
  AuthLayout: ComponentType;
  /** R10：內容區 403 畫面 */
  Forbidden: ComponentType<{ permission?: TPermission }>;
  /** shell 逐頁覆寫表，key = route id（§4.4） */
  pages?: Partial<Record<TRouteId, ComponentType<any>>>;
};
