import { Images } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
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

declare module "@/shared/i18n/types" {
  interface TranslationResources {
    banners: typeof zh;
  }
}

export default defineModule({
  id: "banners",
  kind: "domain",
  i18n: { en, zh },
  mockHandlers: bannersMockHandlers,
  routes: (ctx) =>
    bannersRoutes(ctx, { list: BannerListPage, form: BannerFormPage }),
  nav: [
    {
      id: "banners",
      label: "title",
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
