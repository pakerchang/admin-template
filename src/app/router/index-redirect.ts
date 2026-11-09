import { createRoute, redirect } from "@tanstack/react-router";

import { can } from "@/shared/permission";

import type { TNavItem, TShell } from "@/shared/module";
import type { TGrant } from "@/shared/permission";
import type { AnyRoute, RouteComponent } from "@tanstack/react-router";

/**
 * R9："/" → 第一個 can() 為真的 nav.to；全無 → 內容區渲染 shell.Forbidden（不 redirect）。
 * 包一層 pathless `_index`：protected route 的 id 是 "/"，index route 直接掛上去 id 會撞成 "/"。
 */
export const createIndexRedirect = (
  parent: AnyRoute,
  nav: readonly TNavItem[],
  getGrants: () => readonly TGrant[],
  Forbidden: TShell["Forbidden"]
) => {
  const wrapper = createRoute({
    getParentRoute: () => parent,
    id: "_index",
  });
  return wrapper.addChildren([
    createRoute({
      getParentRoute: () => wrapper,
      path: "/",
      beforeLoad: () => {
        const first = nav.find((n) => can(getGrants(), n.permission));
        if (first) throw redirect({ to: first.to });
      },
      component: Forbidden as RouteComponent,
    }),
  ]) as AnyRoute;
};
