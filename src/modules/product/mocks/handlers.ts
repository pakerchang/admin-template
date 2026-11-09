import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { createCollection } from "@/shared/api/mock-db";

import { products } from "./seed";

const collection = createCollection(products, "product_id", {
  searchField: "product_name",
});

export const productMockHandlers = toHttpHandlers(
  {
    "GET /admin/products": collection.GET,
    "POST /admin/products": collection.POST,
    "POST /admin/products/update": collection.UPDATE,
    "DELETE /admin/products": collection.DELETE,
  },
  { baseUrl: apiBaseUrl }
);
