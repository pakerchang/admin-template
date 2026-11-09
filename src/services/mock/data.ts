import { EOrderStatus } from "@/services/schemas/orders";

import type { TArticle } from "@/services/schemas/article";
import type { TBanner } from "@/services/schemas/banner";
import type { TCustomer } from "@/services/schemas/customer";
import type { TOrder, TOrderItem } from "@/services/schemas/orders";
import type { TProduct } from "@/services/schemas/product";
import type { TStaffUser } from "@/services/schemas/staff";
import type { TSupplier } from "@/services/schemas/supplier";
import type { TTag } from "@/services/schemas/tag";
import type { TUser } from "@/services/schemas/user";
import type { TLang } from "@/services/types/schema";

// ponytail: 以 inline SVG 當圖片，離線可用、不會有外部請求錯誤
export const placeholderImage = (label: string, color = "#6366f1") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="36" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  )}`;

const lang = (en: string, zh: string): TLang => ({ en, zh, th: en });

const iso = (daysAgo: number) =>
  new Date(Date.UTC(2025, 5, 30) - daysAgo * 86_400_000).toISOString();

export const DEMO_ACCOUNT = {
  email: "admin@example.com",
  password: "admin123",
};

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
    i === 0 ? DEMO_ACCOUNT.email : `${first_name.toLowerCase()}@example.com`,
  first_name,
  last_name,
  phone_number: `09${String(12345670 + i).padStart(8, "0")}`,
  address: `No. ${i + 10}, Xinyi Rd., Taipei`,
  remark: "",
  role: role as TUser["role"],
  created_at: iso(200 - i * 10),
  updated_at: iso(20 - i),
}));

export const tags: TTag[] = [
  "Best Seller",
  "New",
  "Organic",
  "Limited",
  "Gift",
  "Seasonal",
  "Imported",
  "Sale",
].map((tag_name, i) => ({ tag_id: `tag-${i + 1}`, tag_name }));

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

const productTypes: NonNullable<TProduct["product_type"]>[] = [
  "FOOD",
  "CONSUMABLES",
  "ELECTRONICS",
  "ACCESSORIES",
  "CLOTHING",
  "DEVICES",
  "MATERIALS",
  "OTHER",
];

export const products: TProduct[] = [
  ["Oolong Tea", "烏龍茶"],
  ["Green Tea", "綠茶"],
  ["Black Tea", "紅茶"],
  ["Jasmine Tea", "茉莉花茶"],
  ["Pu-erh Tea", "普洱茶"],
  ["Tea Cup Set", "茶杯組"],
  ["Tea Kettle", "茶壺"],
  ["Gift Box", "禮盒"],
  ["Matcha Powder", "抹茶粉"],
  ["Herbal Blend", "花草茶"],
].map(([en, zh], i) => ({
  product_id: `product-${i + 1}`,
  product_type: productTypes[i % productTypes.length],
  product_name: en,
  product_images: [
    { file_name: `product-${i + 1}.svg`, file_url: placeholderImage(en) },
  ],
  product_price: String(150 + i * 50),
  product_status: i % 4 === 3 ? "inactive" : "active",
  product_size: String(100 + i * 10),
  vendor_id: [suppliers[i % suppliers.length].supplier_id],
  tag_id: [tags[i % tags.length].tag_id],
  product_detail: {
    product_description: lang(`${en} description`, `${zh} 商品描述`),
    short_title: lang(en, zh),
    ingredients: lang("Tea leaves", "茶葉"),
    introduction: lang(`Introducing ${en}`, `${zh} 介紹`),
    precautions: lang("Store in a cool, dry place", "請存放於陰涼乾燥處"),
    shelf_life: "24 months",
    origin: lang("Taiwan", "台灣"),
    aroma_level: String((i % 5) + 1),
    flavor: lang("Smooth", "順口"),
    appearance: lang("Golden", "金黃"),
    best_occasion: lang("Afternoon", "午後"),
    scene_matching: lang("Office", "辦公室"),
    food_pairing: lang("Pastry", "點心"),
  },
  created_at: iso(120 - i * 5),
  updated_at: iso(10 - (i % 10)),
}));

const orderItem = (product: TProduct, order_id: string): TOrderItem => ({
  product_name: product.product_name,
  product_id: product.product_id,
  size: product.product_size ?? "",
  price: product.product_price,
  order_id,
  promotion_note: "",
  product_images: product.product_images,
});

const orderStatuses = Object.values(EOrderStatus);

export const orders: TOrder[] = Array.from({ length: 10 }, (_, i) => {
  const order_id = `order-${1001 + i}`;
  const items = [
    products[i % products.length],
    products[(i + 3) % products.length],
  ];
  const total = items.reduce((sum, p) => sum + Number(p.product_price), 0);
  const user = users[(i % 5) + 3];
  return {
    vendor_id: suppliers[i % suppliers.length].supplier_id,
    order_id,
    order_detail: items.map((p) => orderItem(p, order_id)),
    order_status: orderStatuses[i % orderStatuses.length],
    contact_info: {
      address: user.address,
      phone: user.phone_number,
      email: user.email,
    },
    remark: i % 3 === 0 ? "Please deliver in the morning" : "",
    delivery_fee: "60",
    delivery_note: "",
    delivery_time: iso(i - 3),
    total_order_fee: String(total + 60),
    user_id: user.user_id,
    created_at: iso(30 - i * 2),
    updated_at: iso(10 - i),
  };
});

export const customers: TCustomer[] = users.slice(3).map((u) => {
  const own = orders.filter((o) => o.user_id === u.user_id);
  return {
    user_id: u.user_id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    phone_number: u.phone_number,
    total_spent: own.reduce((sum, o) => sum + Number(o.total_order_fee), 0),
    order_count: own.length,
    last_order_date: own[0]?.created_at ?? null,
    created_at: u.created_at,
  };
});

export const banners: TBanner[] = [
  "Summer Sale",
  "New Arrivals",
  "Free Shipping",
  "Gift Season",
  "Tea Festival",
  "Member Day",
].map((title, i) => ({
  banner_id: `banner-${i + 1}`,
  title,
  desktop_image_url: {
    file_name: `banner-${i + 1}-desktop.svg`,
    file_url: placeholderImage(title, "#0ea5e9"),
  },
  mobile_image_url: {
    file_name: `banner-${i + 1}-mobile.svg`,
    file_url: placeholderImage(title, "#14b8a6"),
  },
  redirect_url: `https://example.com/campaign/${i + 1}`,
  sort_order: i < 3 ? i + 1 : 0,
  banner_status: i < 3 ? "active" : "inactive",
  created_at: iso(60 - i * 3),
  updated_at: iso(5),
}));

export const staff: TStaffUser[] = users.slice(0, 5).map((u, i) => ({
  staff_id: `staff-${i + 1}`,
  account: u.first_name.toLowerCase(),
  email: u.email,
  first_name: u.first_name,
  last_name: u.last_name,
  role: i === 0 ? "superadmin" : "admin",
  created_at: u.created_at,
  updated_at: u.updated_at,
}));

export const articles: TArticle[] = [
  "How to Brew the Perfect Oolong",
  "A Short History of Taiwanese Tea",
  "Pairing Tea with Desserts",
  "Storing Tea at Home",
  "Our Visit to Alishan",
].map((title, i) => ({
  article_id: `article-${i + 1}`,
  user_id: staff[i % staff.length].staff_id,
  nick_name: staff[i % staff.length].first_name,
  title,
  tags: [tags[i % tags.length].tag_name],
  describe: `${title} — a quick read.`,
  image_url: {
    file_name: `article-${i + 1}.svg`,
    file_url: placeholderImage(
      title.split(" ").slice(0, 3).join(" "),
      "#f59e0b"
    ),
  },
  content_html: `<h2>${title}</h2><p>This is a demo article used for the UI showcase.</p>`,
  created_at: iso(40 - i * 4),
  updated_at: iso(8 - i),
}));
