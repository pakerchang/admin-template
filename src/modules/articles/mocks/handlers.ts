import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { createCollection } from "@/shared/api/mock-db";

import { articles } from "./seed";

const collection = createCollection(articles, "article_id", {
  searchField: "title",
});

export const articlesMockHandlers = toHttpHandlers(
  {
    "GET /admin/articles": collection.GET,
    "POST /admin/articles": collection.POST,
    "PUT /admin/articles": collection.PUT,
    "DELETE /admin/articles": collection.DELETE,
  },
  { baseUrl: apiBaseUrl }
);
