import { Tags } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { tagsMockHandlers } from "./mocks/handlers";
import { tagsRoutes } from "./model/routes";
import TagListPage from "./ui/TagList";

const tagsPermissions = definePermissions({
  tags: z.enum(["read", "create", "update", "delete"]),
});

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof tagsPermissions.schema>,
    true
  > {}
}

declare module "@/shared/i18n/types" {
  interface TranslationResources {
    tags: typeof zh;
  }
}

export default defineModule({
  id: "tags",
  kind: "domain",
  i18n: { en, zh },
  mockHandlers: tagsMockHandlers,
  routes: (ctx) => tagsRoutes(ctx, { list: TagListPage }),
  nav: [
    {
      id: "tags",
      label: "title",
      to: "/tags",
      icon: Tags,
      permission: "tags:read",
      order: 40,
    },
  ],
  permissions: {
    ...tagsPermissions,
    mockGrants: {
      admin: ["tags:*"],
      support: ["tags:read"],
      partner: ["tags:read"],
    },
  },
});

// product 表單用（product requires tags，spec §5.2）
export { useGetAllTags } from "./model/use-tag";
