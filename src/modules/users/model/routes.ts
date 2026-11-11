import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "users.list": true;
    "users.create": true;
    "users.edit": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const usersRoutes = (
  ctx: TRouteContext,
  pages: { list: ComponentType; create: ComponentType; edit: ComponentType }
) => {
  const base = ctx.layout({
    getParentRoute: () => ctx.parent,
    path: "users",
    permission: "users:read",
  });
  return [
    base.addChildren([
      ctx.page({
        getParentRoute: () => base,
        path: "/",
        permission: "users:read",
        routeId: "users.list",
        component: pages.list,
      }),
      ctx.page({
        getParentRoute: () => base,
        path: "create",
        permission: "users:create",
        routeId: "users.create",
        component: pages.create,
      }),
      ctx.page({
        getParentRoute: () => base,
        path: "edit/$id",
        permission: "users:read",
        routeId: "users.edit",
        component: pages.edit,
      }),
    ]),
  ];
};
