import { FileText } from "lucide-react";
import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { articlesMockHandlers } from "./mocks/handlers";
import { articlesRoutes } from "./model/routes";
import ArticleFormPage from "./ui/ArticleForm";
import ArticleListPage from "./ui/ArticleList";

const articlesPermissions = definePermissions({
  articles: z.enum(["read", "create", "update", "delete"]),
});

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof articlesPermissions.schema>,
    true
  > {}
}

declare module "@/shared/i18n/types" {
  interface TranslationResources {
    articles: typeof zh;
  }
}

declare module "@/shared/module" {
  interface TModuleIdRegistry {
    articles: true;
  }
}

export default defineModule({
  id: "articles",
  kind: "domain",
  i18n: { en, zh },
  mockHandlers: articlesMockHandlers,
  routes: (ctx) =>
    articlesRoutes(ctx, { list: ArticleListPage, form: ArticleFormPage }),
  nav: [
    {
      id: "articles",
      label: "title",
      to: "/articles",
      icon: FileText,
      permission: "articles:read",
      order: 80,
    },
  ],
  permissions: {
    ...articlesPermissions,
    mockGrants: {
      admin: ["articles:*"],
      support: ["articles:read"],
      partner: ["articles:read"],
    },
  },
});
