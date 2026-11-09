import { Tags } from "lucide-react";

import TagListPage from "@/pages/tags/TagList";
import { defineModule } from "@/shared/module";

import { tagsRoutes } from "./model/routes";

export default defineModule({
  id: "tags",
  kind: "domain",
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
    mockGrants: { admin: ["tags:*"], partner: ["tags:read"] },
  },
});
