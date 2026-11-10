import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "consumers.list": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const consumersRoutes = (
  ctx: TRouteContext,
  pages: { list: ComponentType }
) => [
  ctx.page({
    getParentRoute: () => ctx.parent,
    path: "customers",
    permission: "consumers:read",
    routeId: "consumers.list",
    component: pages.list,
  }),
];
