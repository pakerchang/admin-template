import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "banners.list": true;
    "banners.create": true;
    "banners.edit": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4）；create / edit 共用同一張表單頁 */
export const bannersRoutes = (
  ctx: TRouteContext,
  pages: { list: ComponentType; form: ComponentType }
) => {
  const base = ctx.layout({
    getParentRoute: () => ctx.parent,
    path: "banners",
    permission: "banners:read",
  });
  return [
    base.addChildren([
      ctx.page({
        getParentRoute: () => base,
        path: "/",
        permission: "banners:read",
        routeId: "banners.list",
        component: pages.list,
      }),
      ctx.page({
        getParentRoute: () => base,
        path: "create",
        permission: "banners:create",
        routeId: "banners.create",
        component: pages.form,
      }),
      ctx.page({
        getParentRoute: () => base,
        path: "edit/$id",
        permission: "banners:update",
        routeId: "banners.edit",
        component: pages.form,
      }),
    ]),
  ];
};
