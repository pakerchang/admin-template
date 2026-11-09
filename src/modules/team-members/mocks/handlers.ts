import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { createCollection } from "@/shared/api/mock-db";

import { staff } from "./seed";

const collection = createCollection(staff, "staff_id");

export const teamMembersMockHandlers = toHttpHandlers(
  {
    "GET /admin/staff": collection.GET,
    // 密碼不存進 mock 狀態
    "POST /admin/staff": ({ body, query }) =>
      collection.POST({ body: { ...body, password: undefined }, query }),
    "PUT /admin/staff": collection.PUT,
    "DELETE /admin/staff": collection.DELETE,
  },
  { baseUrl: apiBaseUrl }
);
