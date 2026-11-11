import { http } from "msw";

import { createCollection } from "@/shared/api/mock-db";

import { suppliers } from "./seed";
import {
  getCreateSupplierMockHandler,
  getDeleteSupplierMockHandler,
  getListSuppliersMockHandler,
  getUpdateSupplierMockHandler,
} from "./suppliers.msw";

import type { Supplier } from "../api/model";
import type { HttpHandler } from "msw";

const collection = createCollection<Supplier>(suppliers, "supplier_id", {
  searchField: "supplier_name",
});

export const suppliersMockHandlers: HttpHandler[] = [
  http.put("*/admin/supplier", collection.notFound), // K1：更新不存在的 id → 404（orval handler 只回 200）
  getListSuppliersMockHandler(collection.list),
  getCreateSupplierMockHandler(collection.create),
  getUpdateSupplierMockHandler(collection.update),
  getDeleteSupplierMockHandler(collection.remove),
];
