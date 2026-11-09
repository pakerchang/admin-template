import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { createCollection } from "@/shared/api/mock-db";

import { suppliers } from "./seed";

const collection = createCollection(suppliers, "supplier_id", {
  searchField: "supplier_name",
});

export const suppliersMockHandlers = toHttpHandlers(
  {
    "GET /admin/supplier": collection.GET,
    "POST /admin/supplier": collection.POST,
    "PUT /admin/supplier": collection.PUT,
    "DELETE /admin/supplier": collection.DELETE,
  },
  { baseUrl: apiBaseUrl }
);
