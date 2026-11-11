import { Users } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { consumersMockHandlers } from "./mocks/handlers";
import { consumersRoutes } from "./model/routes";
import CustomerListPage from "./ui/CustomerList";

const consumersPermissions = definePermissions({ consumers: z.enum(["read"]) });

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof consumersPermissions.schema>,
    true
  > {}
}

declare module "@/shared/i18n/types" {
  interface TranslationResources {
    consumers: typeof zh;
  }
}

export default defineModule({
  id: "consumers",
  kind: "domain",
  i18n: { en, zh },
  mockHandlers: consumersMockHandlers,
  routes: (ctx) => consumersRoutes(ctx, { list: CustomerListPage }),
  nav: [
    {
      id: "consumers",
      label: "title",
      to: "/customers",
      icon: Users,
      permission: "consumers:read",
      order: 10,
    },
  ],
  permissions: {
    ...consumersPermissions,
    mockGrants: {
      admin: ["consumers:*"],
      support: ["consumers:read"],
      partner: ["consumers:read"],
    },
  },
});
