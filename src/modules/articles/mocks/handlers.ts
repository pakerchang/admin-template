import { http } from "msw";

import { createCollection } from "@/shared/api/mock-db";

import {
  getCreateArticleMockHandler,
  getDeleteArticleMockHandler,
  getListArticlesMockHandler,
  getUpdateArticleMockHandler,
} from "./articles.msw";
import { articles } from "./seed";

import type { HttpHandler } from "msw";

const collection = createCollection(articles, "article_id", {
  searchField: "title",
});

export const articlesMockHandlers: HttpHandler[] = [
  http.put("*/admin/articles", collection.notFound), // K1：更新不存在的 id → 404（orval handler 只回 200）
  getListArticlesMockHandler(collection.list),
  getCreateArticleMockHandler(collection.create),
  getUpdateArticleMockHandler(collection.update),
  getDeleteArticleMockHandler(collection.remove),
];
