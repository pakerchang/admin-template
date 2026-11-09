import { Tags } from "lucide-react";

import TagListPage from "@/pages/tags/TagList";
import { defineModule } from "@/shared/module";

import { tagsMockHandlers } from "./mocks/handlers";
import { tagsRoutes } from "./model/routes";

export default defineModule({
  id: "tags",
  kind: "domain",
  mockHandlers: tagsMockHandlers,
  routes: (ctx) => tagsRoutes(ctx, { list: TagListPage }),
  nav: [
    {
      id: "tags",
      label: "dashboard.menu.tags.title",
      to: "/tags",
      icon: Tags,
      permission: "tags:read",
      order: 40,
    },
  ],
  permissions: {
    resources: { tags: ["read", "create", "update", "delete"] },
    mockGrants: {
      admin: ["tags:*"],
      support: ["tags:read"],
      partner: ["tags:read"],
    },
  },
});
