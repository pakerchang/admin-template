import { Receipt } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

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

export default defineModule({
  id: "orders",
  kind: "domain",
  mockHandlers: ordersMockHandlers,
  routes: (ctx) =>
    ordersRoutes(ctx, { list: OrderListPage, details: OrderDetailsPage }),
  nav: [
    {
      id: "orders",
      label: "dashboard.menu.orders.title",
      to: "/orders",
      icon: Receipt,
      permission: "orders:read",
      order: 60,
      children: [
        {
          id: "orders.order-list",
          label: "dashboard.menu.orders.sub.orderList",
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
