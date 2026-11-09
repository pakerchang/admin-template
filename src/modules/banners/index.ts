import { Images } from "lucide-react";

import BannerFormPage from "@/pages/banners/BannerForm";
import BannerListPage from "@/pages/banners/BannerList";
import { defineModule } from "@/shared/module";

import { bannersMockHandlers } from "./mocks/handlers";
import { bannersRoutes } from "./model/routes";

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
    resources: { banners: ["read", "create", "update", "delete"] },
    mockGrants: {
      admin: ["banners:*"],
      support: ["banners:read"],
      partner: ["banners:read"],
    },
  },
});
