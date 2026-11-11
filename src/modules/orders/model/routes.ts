import { redirect } from "@tanstack/react-router";

import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "orders.list": true;
    "orders.details": true;
  }
  /** 只登錄靜態完整路徑（無 $param、無結尾斜線；T2 OD-T2-3） */
  interface TRoutePathRegistry {
    "/orders": true;
    "/orders/order-list": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const ordersRoutes = (
  ctx: TRouteContext<"orders">,
  pages: { list: ComponentType; details: ComponentType }
) => {
  const base = ctx.layout({
    getParentRoute: () => ctx.parent,
    path: "orders",
    permission: "orders:read",
    loader: ({ location }: { location: { pathname: string } }) => {
      if (location.pathname === "/orders") {
        return redirect({ to: "/orders/order-list" });
      }
    },
  });
  return [
    base.addChildren([
      ctx.page({
        getParentRoute: () => base,
        path: "order-list",
        permission: "orders:read",
        routeId: "orders.list",
        component: pages.list,
      }),
      ctx.page({
        getParentRoute: () => base,
        path: "$id",
        permission: "orders:read",
        routeId: "orders.details",
        component: pages.details,
      }),
    ]),
  ];
};
