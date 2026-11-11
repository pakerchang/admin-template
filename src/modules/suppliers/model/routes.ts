import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "suppliers.list": true;
  }
  /** 只登錄靜態完整路徑（無 $param、無結尾斜線；T2 OD-T2-3） */
  interface TRoutePathRegistry {
    "/suppliers": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const suppliersRoutes = (
  ctx: TRouteContext<"suppliers">,
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
