import type { TPublicRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "auth.login": true;
  }
  /** 只登錄靜態完整路徑（無 $param、無結尾斜線；T2 OD-T2-3） */
  interface TRoutePathRegistry {
    "/login": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const authRoutes = (
  ctx: TPublicRouteContext<"auth">,
  pages: { login: ComponentType }
) => [
  ctx.page({
    getParentRoute: () => ctx.parent,
    path: "login",
    routeId: "auth.login",
    component: pages.login,
  }),
];
