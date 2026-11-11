import { Receipt } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { ordersMockHandlers } from "./mocks/handlers";
import { ordersRoutes } from "./model/routes";
import OrderDetailsPage from "./ui/order-details";
import OrderListPage from "./ui/OrderList";

const ordersPermissions = definePermissions({
  orders: z.enum(["read", "update"]),
});

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof ordersPermissions.schema>,
    true
  > {}
}

declare module "@/shared/i18n/types" {
  interface TranslationResources {
    orders: typeof zh;
  }
}

export default defineModule({
  id: "orders",
  kind: "domain",
  i18n: { en, zh },
  mockHandlers: ordersMockHandlers,
  routes: (ctx) =>
    ordersRoutes(ctx, { list: OrderListPage, details: OrderDetailsPage }),
  nav: [
    {
      id: "orders",
      label: "title",
      to: "/orders",
      icon: Receipt,
      permission: "orders:read",
      order: 60,
      children: [
        {
          id: "orders.order-list",
          label: "orderList",
          to: "/orders/order-list",
          permission: "orders:read",
        },
      ],
    },
  ],
  permissions: {
    ...ordersPermissions,
    mockGrants: { admin: ["orders:*"], support: ["orders:*"] },
  },
});
