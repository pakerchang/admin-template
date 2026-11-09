import { iso } from "@/shared/api/mock-db";

import type { TUser } from "@/services/schemas/user";

/** 第一筆是 demo 帳號（auth module 的 DEMO_ACCOUNT.email） */
export const users: TUser[] = [
  ["Alice", "Chen", "superadmin"],
  ["Bob", "Lin", "admin"],
  ["Carol", "Wang", "support"],
  ["David", "Huang", "partner"],
  ["Eve", "Liu", "premium"],
  ["Frank", "Wu", "user"],
  ["Grace", "Tsai", "user"],
  ["Henry", "Kuo", "guest"],
].map(([first_name, last_name, role], i) => ({
  user_id: `user-${i + 1}`,
  email:
    i === 0 ? "admin@example.com" : `${first_name.toLowerCase()}@example.com`,
  first_name,
  last_name,
  phone_number: `09${String(12345670 + i).padStart(8, "0")}`,
  address: `No. ${i + 10}, Xinyi Rd., Taipei`,
  remark: "",
  role: role as TUser["role"],
  created_at: iso(200 - i * 10),
  updated_at: iso(20 - i),
}));
