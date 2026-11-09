import { Building2 } from "lucide-react";

import SupplierListPage from "@/pages/suppliers/SupplierList";
import { defineModule } from "@/shared/module";

import { suppliersMockHandlers } from "./mocks/handlers";
import { suppliersRoutes } from "./model/routes";

export default defineModule({
  id: "suppliers",
  kind: "domain",
  mockHandlers: suppliersMockHandlers,
  routes: (ctx) => suppliersRoutes(ctx, { list: SupplierListPage }),
  nav: [
    {
      id: "suppliers",
      label: "dashboard.menu.suppliers.title",
      to: "/suppliers",
      icon: Building2,
      permission: "suppliers:read",
      order: 30,
    },
  ],
  permissions: {
    resources: { suppliers: ["read", "create", "update", "delete"] },
    mockGrants: {
      admin: ["suppliers:*"],
      support: ["suppliers:read"],
      partner: ["suppliers:read"],
    },
  },
});
