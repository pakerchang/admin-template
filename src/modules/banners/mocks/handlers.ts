import { http } from "msw";

import { createCollection } from "@/shared/api/mock-db";

import {
  getCreateBannerMockHandler,
  getDeleteBannerMockHandler,
  getListBannersMockHandler,
  getUpdateBannerMockHandler,
} from "./banners.msw";
import { banners } from "./seed";

import type { HttpHandler } from "msw";

const collection = createCollection(banners, "banner_id", {
  searchField: "title",
});

export const bannersMockHandlers: HttpHandler[] = [
  http.put("*/admin/banners", collection.notFound), // K1：更新不存在的 id → 404（orval handler 只回 200）
  getListBannersMockHandler(collection.list),
  getCreateBannerMockHandler(collection.create),
  getUpdateBannerMockHandler(collection.update),
  getDeleteBannerMockHandler(collection.remove),
];
