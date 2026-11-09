import { FileText } from "lucide-react";

import { defineModule } from "@/shared/module";

import { articlesMockHandlers } from "./mocks/handlers";
import { articlesRoutes } from "./model/routes";
import ArticleFormPage from "./ui/ArticleForm";
import ArticleListPage from "./ui/ArticleList";

export default defineModule({
  id: "articles",
  kind: "domain",
  mockHandlers: articlesMockHandlers,
  routes: (ctx) =>
    articlesRoutes(ctx, { list: ArticleListPage, form: ArticleFormPage }),
  nav: [
    {
      id: "articles",
      label: "dashboard.menu.articles.title",
      to: "/articles",
      icon: FileText,
      permission: "articles:read",
      order: 80,
    },
  ],
  permissions: {
    resources: { articles: ["read", "create", "update", "delete"] },
    mockGrants: {
      admin: ["articles:*"],
      support: ["articles:read"],
      partner: ["articles:read"],
    },
  },
});
