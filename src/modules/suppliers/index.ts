import { Building2 } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { suppliersMockHandlers } from "./mocks/handlers";
import { suppliersRoutes } from "./model/routes";
import SupplierListPage from "./ui/SupplierList";

const suppliersPermissions = definePermissions({
  suppliers: z.enum(["read", "create", "update", "delete"]),
});

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof suppliersPermissions.schema>,
    true
  > {}
}

declare module "@/shared/i18n/types" {
  interface TranslationResources {
    suppliers: typeof zh;
  }
}

declare module "@/shared/module" {
  interface TModuleIdRegistry {
    suppliers: true;
  }
}

export default defineModule({
  id: "suppliers",
  kind: "domain",
  i18n: { en, zh },
  mockHandlers: suppliersMockHandlers,
  routes: (ctx) => suppliersRoutes(ctx, { list: SupplierListPage }),
  nav: [
    {
      id: "suppliers",
      label: "title",
      to: "/suppliers",
      icon: Building2,
      permission: "suppliers:read",
      order: 30,
    },
  ],
  permissions: {
    ...suppliersPermissions,
    mockGrants: {
      admin: ["suppliers:*"],
      support: ["suppliers:read"],
      partner: ["suppliers:read"],
    },
  },
});

// product 表單用（product requires suppliers，spec §5.2）
export { useGetSupplierAll } from "./model/use-supplier";
