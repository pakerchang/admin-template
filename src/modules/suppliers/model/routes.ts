import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "suppliers.list": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const suppliersRoutes = (
  ctx: TRouteContext,
  pages: { list: ComponentType }
) => [
  ctx.page({
    getParentRoute: () => ctx.parent,
    path: "suppliers",
    permission: "suppliers:read",
    routeId: "suppliers.list",
    component: pages.list,
  }),
];
