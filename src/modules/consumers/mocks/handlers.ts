import { createCollection } from "@/shared/api/mock-db";

import {
  getListCustomersMockHandler,
  getListTransactionHistoryMockHandler,
} from "./consumers.msw";
import { customers, transactions } from "./seed";

import type { Customer, Order } from "../api/model";
import type { HttpHandler } from "msw";

const customerCollection = createCollection<Customer>(customers, "user_id");
const transactionCollection = createCollection<Order>(transactions, "order_id");

export const consumersMockHandlers: HttpHandler[] = [
  getListCustomersMockHandler(customerCollection.list),
  getListTransactionHistoryMockHandler(transactionCollection.list),
];
