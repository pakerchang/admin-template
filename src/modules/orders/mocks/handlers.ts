import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { createCollection } from "@/shared/api/mock-db";

import { orders } from "./seed";

const collection = createCollection(orders, "order_id");

export const ordersMockHandlers = toHttpHandlers(
  {
    "GET /admin/order": collection.GET,
    "POST /admin/order": collection.UPDATE,
    "POST /admin/order/update": collection.UPDATE,
  },
  { baseUrl: apiBaseUrl }
);
