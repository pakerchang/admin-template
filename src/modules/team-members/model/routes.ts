import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "team-members.list": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const teamMembersRoutes = (
  ctx: TRouteContext,
  pages: { list: ComponentType }
) => [
  ctx.page({
    getParentRoute: () => ctx.parent,
    path: "team-members",
    permission: "team-members:read",
    routeId: "team-members.list",
    component: pages.list,
  }),
];
