import { Users } from "lucide-react";

import { defineModule } from "@/shared/module";

import { consumersMockHandlers } from "./mocks/handlers";
import { consumersRoutes } from "./model/routes";
import CustomerListPage from "./ui/CustomerList";

export default defineModule({
  id: "consumers",
  kind: "domain",
  mockHandlers: consumersMockHandlers,
  routes: (ctx) => consumersRoutes(ctx, { list: CustomerListPage }),
  nav: [
    {
      id: "consumers",
      label: "dashboard.menu.customers.title",
      to: "/customers",
      icon: Users,
      permission: "consumers:read",
      order: 10,
    },
  ],
  permissions: {
    resources: { consumers: ["read"] },
    mockGrants: {
      admin: ["consumers:*"],
      support: ["consumers:read"],
      partner: ["consumers:read"],
    },
  },
});
