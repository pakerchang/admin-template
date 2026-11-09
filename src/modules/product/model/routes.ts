import type { TRouteContext } from "@/shared/module";
import type { ComponentType } from "react";

declare module "@/shared/module" {
  interface TRouteIdRegistry {
    "product.list": true;
    "product.create": true;
    "product.edit": true;
    "product.draft": true;
  }
}

/** headless：不 import ui，頁面由 index.ts 注入（§4.4） */
export const productRoutes = (
  ctx: TRouteContext,
  pages: {
    list: ComponentType;
    create: ComponentType;
    edit: ComponentType;
    draft: ComponentType;
  }
) => {
  const base = ctx.layout({
    getParentRoute: () => ctx.parent,
    path: "products",
    permission: "product:read",
  });
  const page = (path: string, name: keyof typeof pages) =>
    ctx.page({
      getParentRoute: () => base,
      path,
      permission: "product:read",
      routeId: `product.${name}`,
      component: pages[name],
    });
  return [
    base.addChildren([
      page("/", "list"),
      page("create", "create"),
      page("edit/$id", "edit"),
      page("draft/$id", "draft"),
    ]),
  ];
};
