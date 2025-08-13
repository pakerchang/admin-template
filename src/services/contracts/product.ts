import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  activeStatusEnums,
  imageResponseSchema,
  imageSchema,
  langSchema,
  paginationSchema,
  sortSchema,
} from "@/services/types/schema";

import type {
  TImageResponseSchema,
  TGetResponseContent,
  TPostResponseContent,
  TError,
} from "@/services/types/schema";

const c = initContract();

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
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type TProduct = z.infer<typeof productSchema>;
export type TProductDetails = z.infer<typeof productSchema>["product_detail"];

export const productQuerySchema = paginationSchema
  .merge(sortSchema.partial())
  .extend({
    product_status: activeStatusEnums.optional(),
  });

export type TProductQuery = z.infer<typeof productQuerySchema>;

export const productContract = c.router({
  getProducts: {
    method: "GET",
    path: "/admin/products",
    query: productQuerySchema,
    responses: {
      200: c.type<TGetResponseContent<TProduct[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getAllProducts: {
    method: "GET",
    path: "/admin/products",
    responses: {
      200: c.type<TGetResponseContent<TProduct[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getProduct: {
    method: "GET",
    path: "/admin/products",
    query: productSchema
      .pick({
        product_id: true,
        product_status: true,
      })
      .optional(),
    responses: {
      200: c.type<TGetResponseContent<TProduct[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  createProduct: {
    method: "POST",
    path: "/admin/products",
    body: productSchema.omit({ product_id: true }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateProduct: {
    method: "POST",
    path: "/admin/products/update",
    body: productSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteProduct: {
    method: "DELETE",
    path: "/admin/products",
    body: productSchema.pick({ product_id: true }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  uploadProductImage: {
    method: "POST",
    path: "/admin/images",
    body: imageSchema,
    responses: {
      200: c.type<TGetResponseContent<TImageResponseSchema>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteProductImage: {
    method: "DELETE",
    path: "/admin/images",
    body: z.object({ file_names: z.array(z.string()) }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
