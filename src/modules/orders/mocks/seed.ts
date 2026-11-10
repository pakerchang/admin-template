import { iso, placeholderImage } from "@/shared/api/mock-db";

import { EOrderStatus } from "../model/schema";

import type { TOrder, TOrderItem } from "../model/schema";

/**
 * R5：訂單自帶商品快照與買家聯絡資料（值與 product / users seed 一致，不讀它們的 collection）。
 * consumers module 的 transaction seed 是同一份資料的另一個副本（consumers/mocks/seed.ts）。
 */
const PRODUCT_NAMES = [
  "Oolong Tea",
  "Green Tea",
  "Black Tea",
  "Jasmine Tea",
  "Pu-erh Tea",
  "Tea Cup Set",
  "Tea Kettle",
  "Gift Box",
  "Matcha Powder",
  "Herbal Blend",
];
/** 買家 = users seed 第 4–8 筆（user-4 … user-8） */
const BUYERS = ["David", "Eve", "Frank", "Grace", "Henry"];
const SUPPLIER_COUNT = 5;

const orderItem = (p: number, order_id: string): TOrderItem => ({
  product_name: PRODUCT_NAMES[p],
  product_id: `product-${p + 1}`,
  size: String(100 + p * 10),
  price: String(150 + p * 50),
  order_id,
  promotion_note: "",
  product_images: [
    {
      file_name: `product-${p + 1}.svg`,
      file_url: placeholderImage(PRODUCT_NAMES[p]),
    },
  ],
});

const orderStatuses = Object.values(EOrderStatus);

export const orders: TOrder[] = Array.from({ length: 10 }, (_, i) => {
  const order_id = `order-${1001 + i}`;
  const items = [i % 10, (i + 3) % 10];
  const total = items.reduce((sum, p) => sum + 150 + p * 50, 0);
  const u = (i % 5) + 3; // users seed index
  return {
    vendor_id: `supplier-${(i % SUPPLIER_COUNT) + 1}`,
    order_id,
    order_detail: items.map((p) => orderItem(p, order_id)),
    order_status: orderStatuses[i % orderStatuses.length],
    contact_info: {
      address: `No. ${u + 10}, Xinyi Rd., Taipei`,
      phone: `09${String(12345670 + u).padStart(8, "0")}`,
      email: `${BUYERS[u - 3].toLowerCase()}@example.com`,
    },
    remark: i % 3 === 0 ? "Please deliver in the morning" : "",
    delivery_fee: "60",
    delivery_note: "",
    delivery_time: iso(i - 3),
    total_order_fee: String(total + 60),
    user_id: `user-${u + 1}`,
    created_at: iso(30 - i * 2),
    updated_at: iso(10 - i),
  };
});
