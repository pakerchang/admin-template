import { Building2 } from "lucide-react";

import { defineModule } from "@/shared/module";

import { suppliersMockHandlers } from "./mocks/handlers";
import { suppliersRoutes } from "./model/routes";
import SupplierListPage from "./ui/SupplierList";

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

// product 表單用（product requires suppliers，spec §5.2）
export { useGetSupplierAll } from "./model/use-supplier";
