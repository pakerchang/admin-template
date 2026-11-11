import { http } from "msw";

import { createCollection } from "@/shared/api/mock-db";

import {
  getCreateProductMockHandler,
  getDeleteProductMockHandler,
  getListProductsMockHandler,
  getUpdateProductMockHandler,
} from "./product.msw";
import { products } from "./seed";

import type { Product } from "../api/model";
import type { HttpHandler } from "msw";

const collection = createCollection<Product>(products, "product_id", {
  searchField: "product_name",
});

export const productMockHandlers: HttpHandler[] = [
  // K1：更新不存在的 id → 404（orval handler 只回 200）
  http.post("*/admin/products/update", collection.notFound),
  getListProductsMockHandler(collection.list),
  getCreateProductMockHandler(collection.create),
  getUpdateProductMockHandler(collection.update),
  getDeleteProductMockHandler(collection.remove),
];
