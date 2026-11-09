import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { createCollection } from "@/shared/api/mock-db";

import { tags } from "./seed";

const collection = createCollection(tags, "tag_id", {
  searchField: "tag_name",
});

export const tagsMockHandlers = toHttpHandlers(
  {
    "GET /admin/tag": collection.GET,
    "POST /admin/tag": collection.POST,
    "PUT /admin/tag": collection.PUT,
    "DELETE /admin/tag": collection.DELETE,
  },
  { baseUrl: apiBaseUrl }
);
