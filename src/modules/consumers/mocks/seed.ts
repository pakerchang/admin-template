import { iso, placeholderImage } from "@/shared/api/mock-db";

import { OrderStatus } from "../api/model";

import type { Customer, Order } from "../api/model";

/**
 * R5：自帶 customer 與 transaction seed（值與 users / orders seed 一致，不讀它們的 collection）。
 * 因此 orders module 改訂單狀態不會反映在購買紀錄（各 module 各自的記憶體資料）。
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
const ORDER_STATUSES = Object.values(OrderStatus);
/** 顧客 = users seed 第 4–8 筆（index 3–7） */
const CUSTOMERS = [
  ["David", "Huang"],
  ["Eve", "Liu"],
  ["Frank", "Wu"],
  ["Grace", "Tsai"],
  ["Henry", "Kuo"],
];
const SUPPLIER_COUNT = 5;

const contactOf = (u: number) => ({
  address: `No. ${u + 10}, Xinyi Rd., Taipei`,
  phone: `09${String(12345670 + u).padStart(8, "0")}`,
  email: `${CUSTOMERS[u - 3][0].toLowerCase()}@example.com`,
});

export const transactions = Array.from({ length: 10 }, (_, i) => {
  const order_id = `order-${1001 + i}`;
  const items = [i % 10, (i + 3) % 10];
  const total = items.reduce((sum, p) => sum + 150 + p * 50, 0);
  const u = (i % 5) + 3;
  return {
    vendor_id: `supplier-${(i % SUPPLIER_COUNT) + 1}`,
    order_id,
    order_detail: items.map((p) => ({
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
    })),
    order_status: ORDER_STATUSES[i % ORDER_STATUSES.length],
    contact_info: contactOf(u),
    remark: i % 3 === 0 ? "Please deliver in the morning" : "",
    delivery_fee: "60",
    delivery_note: "",
    delivery_time: iso(i - 3),
    total_order_fee: String(total + 60),
    user_id: `user-${u + 1}`,
    created_at: iso(30 - i * 2),
    updated_at: iso(10 - i),
  };
}) satisfies Order[];

export const customers = CUSTOMERS.map(([first_name, last_name], k) => {
  const u = k + 3;
  const user_id = `user-${u + 1}`;
  const own = transactions.filter((o) => o.user_id === user_id);
  return {
    user_id,
    email: contactOf(u).email,
    first_name,
    last_name,
    phone_number: contactOf(u).phone,
    total_spent: own.reduce((sum, o) => sum + Number(o.total_order_fee), 0),
    order_count: own.length,
    last_order_date: own[0]?.created_at ?? null,
    created_at: iso(200 - u * 10),
  };
}) satisfies Customer[];
