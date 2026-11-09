import { apiBaseUrl } from "@/shared/api/fetcher";
import { toHttpHandlers } from "@/shared/api/mock/legacy-adapter";
import { createCollection, listResponse } from "@/shared/api/mock-db";

import { customers, transactions } from "./seed";

const customerCollection = createCollection(customers, "user_id");
const transactionCollection = createCollection(transactions, "order_id");

export const consumersMockHandlers = toHttpHandlers(
  {
    "GET /admin/customers": ({ query }) =>
      listResponse(customerCollection.all(), query),
    "GET /admin/transaction_history": ({ query }) =>
      listResponse(transactionCollection.all(), query),
  },
  { baseUrl: apiBaseUrl }
);
