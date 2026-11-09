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

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    permission?: TPermission | "authenticated";
    /** 執行期 metadata，用 string：TRouteId 在無 module augment 時為 never */
    routeId?: string;
  }
}

export type TNavItem = {
  id: string;
  /** i18n key，必須以 `${moduleId}.` 開頭 */
  label: string;
  /** 絕對路徑（跨 module 導航只經 nav 字串） */
  to: string;
  icon?: ComponentType<{ className?: string }>;
  /** 必填，nav 過濾依據（§6.3） */
  permission: TPermission;
  /** 排序，預設 100 */
  order?: number;
  children?: Omit<TNavItem, "icon" | "children">[];
};

/** F5：layout route 與 page route 用兩個 typed helper 區分 */
type TGuard = { permission: TPermission | "authenticated" };
export type TLayoutRouteOpts<TOpts> = TOpts &
  TGuard & {
    /** layout route 不得有畫面（只做路徑分組，渲染 <Outlet />） */
    component?: never;
    routeId?: never;
  };
export type TPageRouteOpts<TOpts> = TOpts &
  TGuard & {
    /** 必填：有畫面就必須可覆寫（D1）；格式 `${moduleId}.${name}`（R23） */
    routeId: TRouteId;
    /** 必填：module 預設頁面（由 index.ts 注入，§4.4） */
    component: ComponentType<any>;
  };

export type TRouteContext = {
  /** protected layout route */
  parent: AnyRoute;
  /** kernel 注入：runtime 帶 component → build() throw */
  layout: <TOpts>(opts: TLayoutRouteOpts<TOpts>) => AnyRoute;
  /** kernel 注入：runtime 缺 routeId 或 component → build() throw */
  page: <TOpts>(opts: TPageRouteOpts<TOpts>) => AnyRoute;
};

/** publicRoutes（例：/login）也要能覆寫，同樣只給 page / layout helper，但不掛 permission guard */
export type TPublicRouteContext = {
  /** auth layout route */
  parent: AnyRoute;
  layout: <TOpts>(
    opts: TOpts & { component?: never; routeId?: never }
  ) => AnyRoute;
  page: <TOpts>(
    opts: TOpts & { routeId: TRouteId; component: ComponentType<any> }
  ) => AnyRoute;
};

export type TModule = {
  /** kebab-case，唯一 */
  id: string;
  /** D4 驗收腳本依此挑出 domain */
  kind: "generic" | "domain";
  /** R8：依賴的 module id；缺 → build() fail fast */
  requires?: readonly string[];
  routes?: (ctx: TRouteContext) => AnyRoute[];
  publicRoutes?: (ctx: TPublicRouteContext) => AnyRoute[];
  nav?: TNavItem[];
  /** 裸字典（不含 module id 頂層）；kernel 以 { [id]: dict } scope（§4.3、§5.4） */
  i18n?: Record<TLocale, Record<string, unknown>>;
  /** R11：MSW handler */
  mockHandlers?: HttpHandler[];
  /** R21：權限目錄 resources + 角色預設 grant mockGrants */
  permissions?: TModulePermissions;
};

/** 純型別輔助 */
export const defineModule = <const M extends TModule>(m: M): M => m;

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
