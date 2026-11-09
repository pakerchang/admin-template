import { iso } from "@/shared/api/mock-db";

import type { TSupplier } from "@/services/schemas/supplier";

export const suppliers: TSupplier[] = [
  "Mountain Tea Co.",
  "Sunrise Farms",
  "Blue Ocean Trading",
  "Green Leaf Ltd.",
  "Golden Harvest",
].map((supplier_name, i) => ({
  supplier_id: `supplier-${i + 1}`,
  supplier_name,
  contact_info: {
    phone: `02-2700-00${10 + i}`,
    email: `contact${i + 1}@supplier.example.com`,
    address: `No. ${i + 1}, Zhongshan Rd., Taichung`,
  },
  remark: i % 2 === 0 ? "Preferred supplier" : "",
  created_at: iso(300 - i * 20),
  updated_at: iso(30 - i),
}));
