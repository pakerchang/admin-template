import { Users } from "lucide-react";

import CustomerListPage from "@/pages/consumers/CustomerList";
import { defineModule } from "@/shared/module";

import { consumersRoutes } from "./model/routes";

export default defineModule({
  id: "consumers",
  kind: "domain",
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
  permissions: { resources: { consumers: ["read"] } },
});
