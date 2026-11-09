import { Receipt } from "lucide-react";

import OrderDetailsPage from "@/pages/orders/order-details";
import OrderListPage from "@/pages/orders/OrderList";
import { defineModule } from "@/shared/module";

import { ordersRoutes } from "./model/routes";

export default defineModule({
  id: "orders",
  kind: "domain",
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
  permissions: { resources: { orders: ["read"] } },
});
