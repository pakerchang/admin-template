import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { createCollection } from "@/shared/api/mock-db";

import { banners } from "./seed";

const collection = createCollection(banners, "banner_id", {
  searchField: "title",
});

export const bannersMockHandlers = toHttpHandlers(
  {
    "GET /admin/banners": collection.GET,
    "POST /admin/banners": collection.POST,
    "PUT /admin/banners": collection.PUT,
    "DELETE /admin/banners": collection.DELETE,
  },
  { baseUrl: apiBaseUrl }
);
