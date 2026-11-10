import { Receipt } from "lucide-react";

import { defineModule } from "@/shared/module";

import { ordersMockHandlers } from "./mocks/handlers";
import { ordersRoutes } from "./model/routes";
import OrderDetailsPage from "./ui/order-details";
import OrderListPage from "./ui/OrderList";

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
    resources: { orders: ["read", "update"] },
    mockGrants: { admin: ["orders:*"], support: ["orders:*"] },
  },
});
