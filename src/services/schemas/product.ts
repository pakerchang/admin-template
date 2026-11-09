import { z } from "zod";

import {
  activeStatusEnums,
  imageResponseSchema,
  langSchema,
  paginationSchema,
  sortSchema,
} from "@/shared/api/schema";

export const productTypeEnums = z.enum([
  "ELECTRONICS",
  "ACCESSORIES",
  "CONSUMABLES",
  "DEVICES",
  "MATERIALS",
  "FOOD",
  "CLOTHING",
  "OTHER",
  "NO_TYPE",
]);
export type EProductType = z.infer<typeof productTypeEnums>;

export const productSchema = z.object({
  product_id: z.string(),
  product_type: productTypeEnums.optional(),
  product_name: z.string(),
  product_images: z.array(imageResponseSchema),
  product_price: z.string(),
  product_status: activeStatusEnums.optional(),
  product_size: z.string().optional(),
  vendor_id: z.array(z.string()).optional(),
  tag_id: z.array(z.string()).optional(),
  product_detail: z.object({
    product_description: langSchema,
    short_title: langSchema,
    ingredients: langSchema,
    introduction: langSchema,
    precautions: langSchema,
    shelf_life: z.string(),
    origin: langSchema,
    aroma_level: z.string(),
    flavor: langSchema,
    appearance: langSchema,
    best_occasion: langSchema,
    scene_matching: langSchema,
    food_pairing: langSchema,
  }),
  created_at: z.iso.datetime().optional(),
  updated_at: z.iso.datetime().optional(),
});

export type TProduct = z.infer<typeof productSchema>;
export type TProductDetails = z.infer<typeof productSchema>["product_detail"];

export const productQuerySchema = paginationSchema
  .extend(sortSchema.partial().shape)
  .extend({
    product_status: activeStatusEnums.optional(),
  });

export type TProductQuery = z.infer<typeof productQuerySchema>;
