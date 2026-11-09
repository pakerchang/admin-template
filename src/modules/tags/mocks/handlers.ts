import { http } from "msw";

import { createCollection } from "@/shared/api/mock-db";

import { tags } from "./seed";
import {
  getCreateTagMockHandler,
  getDeleteTagMockHandler,
  getListTagsMockHandler,
  getUpdateTagMockHandler,
} from "./tags.msw";

import type { HttpHandler } from "msw";

const collection = createCollection(tags, "tag_id", {
  searchField: "tag_name",
});

export const tagsMockHandlers: HttpHandler[] = [
  http.put("*/admin/tag", collection.notFound), // K1：更新不存在的 id → 404（orval handler 只回 200）
  getListTagsMockHandler(collection.list),
  getCreateTagMockHandler(collection.create),
  getUpdateTagMockHandler(collection.update),
  getDeleteTagMockHandler(collection.remove),
];
