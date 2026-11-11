import { http } from "msw";

import { createCollection } from "@/shared/api/mock-db";

import { staff } from "./seed";
import {
  getCreateStaffMockHandler,
  getDeleteStaffMockHandler,
  getListStaffsMockHandler,
  getUpdateStaffMockHandler,
} from "./team-members.msw";

import type { Staff } from "../api/model";
import type { HttpHandler } from "msw";

const collection = createCollection<Staff>(staff, "staff_id");

export const teamMembersMockHandlers: HttpHandler[] = [
  http.put("*/admin/staff", collection.notFound), // K1：更新不存在的 id → 404（orval handler 只回 200）
  getListStaffsMockHandler(collection.list),
  // 密碼不存進 mock 狀態
  getCreateStaffMockHandler((info) =>
    collection.create(info, { password: undefined })
  ),
  getUpdateStaffMockHandler(collection.update),
  getDeleteStaffMockHandler(collection.remove),
];
