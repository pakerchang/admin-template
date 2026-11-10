import { http } from "msw";

import { createCollection } from "@/shared/api/mock-db";

import {
  getListOrdersMockHandler,
  getSaveOrderMockHandler,
  getUpdateOrderMockHandler,
} from "./orders.msw";
import { orders } from "./seed";

import type { HttpHandler } from "msw";

const collection = createCollection(orders, "order_id");

export const ordersMockHandlers: HttpHandler[] = [
  // K1：更新不存在的 id → 404（orval handler 只回 200）
  http.post("*/admin/order", collection.notFound),
  http.post("*/admin/order/update", collection.notFound),
  getListOrdersMockHandler(collection.list),
  getSaveOrderMockHandler(collection.update),
  getUpdateOrderMockHandler(collection.update),
];
