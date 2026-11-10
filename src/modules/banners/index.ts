import { Images } from "lucide-react";

import { defineModule } from "@/shared/module";

import { bannersMockHandlers } from "./mocks/handlers";
import { bannersRoutes } from "./model/routes";
import BannerFormPage from "./ui/BannerForm";
import BannerListPage from "./ui/BannerList";

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
