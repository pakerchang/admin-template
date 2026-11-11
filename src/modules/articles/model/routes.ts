import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "articles.list": true;
    "articles.create": true;
    "articles.edit": true;
  }
  /** 只登錄靜態完整路徑（無 $param、無結尾斜線；T2 OD-T2-3） */
  interface TRoutePathRegistry {
    "/articles": true;
    "/articles/create": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4）；create / edit 共用同一張表單頁 */
export const articlesRoutes = (
  ctx: TRouteContext<"articles">,
  pages: { list: ComponentType; form: ComponentType }
) => {
  const base = ctx.layout({
    getParentRoute: () => ctx.parent,
    path: "articles",
    permission: "articles:read",
  });
  return [
    base.addChildren([
      ctx.page({
        getParentRoute: () => base,
        path: "/",
        permission: "articles:read",
        routeId: "articles.list",
        component: pages.list,
      }),
      ctx.page({
        getParentRoute: () => base,
        path: "create",
        permission: "articles:create",
        routeId: "articles.create",
        component: pages.form,
      }),
      ctx.page({
        getParentRoute: () => base,
        path: "edit/$id",
        permission: "articles:update",
        routeId: "articles.edit",
        component: pages.form,
      }),
    ]),
  ];
};
