import { Images } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import { bannersMockHandlers } from "./mocks/handlers";
import { bannersRoutes } from "./model/routes";
import BannerFormPage from "./ui/BannerForm";
import BannerListPage from "./ui/BannerList";

const bannersPermissions = definePermissions({
  banners: z.enum(["read", "create", "update", "delete"]),
});

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof bannersPermissions.schema>,
    true
  > {}
}

export default defineModule({
  id: "banners",
  kind: "domain",
  mockHandlers: bannersMockHandlers,
  routes: (ctx) =>
    bannersRoutes(ctx, { list: BannerListPage, form: BannerFormPage }),
  nav: [
    {
      id: "banners",
      label: "dashboard.menu.banners.title",
      to: "/banners",
      icon: Images,
      permission: "banners:read",
      order: 70,
    },
  ],
  permissions: {
    ...bannersPermissions,
    mockGrants: {
      admin: ["banners:*"],
      support: ["banners:read"],
      partner: ["banners:read"],
    },
  },
});
