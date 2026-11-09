import { iso } from "@/shared/api/mock-db";

import type { TStaffUser } from "@/services/schemas/staff";

/** R5：自帶 staff seed（人名 / email / 時間與 users seed 前 5 筆一致，不讀 users 的 collection） */
export const staff: TStaffUser[] = [
  ["Alice", "Chen"],
  ["Bob", "Lin"],
  ["Carol", "Wang"],
  ["David", "Huang"],
  ["Eve", "Liu"],
].map(([first_name, last_name], i) => ({
  staff_id: `staff-${i + 1}`,
  account: first_name.toLowerCase(),
  email:
    i === 0 ? "admin@example.com" : `${first_name.toLowerCase()}@example.com`,
  first_name,
  last_name,
  role: i === 0 ? "superadmin" : "admin",
  created_at: iso(200 - i * 10),
  updated_at: iso(20 - i),
}));
