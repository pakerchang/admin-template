import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "users.list": true;
    "users.edit": true;
  }
  /** 只登錄靜態完整路徑（無 $param、無結尾斜線；T2 OD-T2-3） */
  interface TRoutePathRegistry {
    "/users": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const usersRoutes = (
  ctx: TRouteContext<"users">,
  pages: { list: ComponentType; edit: ComponentType }
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
        path: "edit/$id",
        permission: "users:read",
        routeId: "users.edit",
        component: pages.edit,
      }),
    ]),
  ];
};
