import type { TPublicRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "auth.login": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const authRoutes = (
  ctx: TPublicRouteContext,
  pages: { login: ComponentType }
) => [
  ctx.page({
    getParentRoute: () => ctx.parent,
    path: "login",
    routeId: "auth.login",
    component: pages.login,
  }),
];
