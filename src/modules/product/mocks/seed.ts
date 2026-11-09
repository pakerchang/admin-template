import { iso, lang, placeholderImage } from "@/shared/api/mock-db";

import type { TProduct } from "../model/schema";

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

/** supplier / tag 以 id 參照（suppliers seed 5 筆、tags seed 8 筆）；R5：不讀它們的 collection */
const SUPPLIER_COUNT = 5;
const TAG_COUNT = 8;

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
  vendor_id: [`supplier-${(i % SUPPLIER_COUNT) + 1}`],
  tag_id: [`tag-${(i % TAG_COUNT) + 1}`],
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
