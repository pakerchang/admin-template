import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { paginationSchema, sortSchema } from "@/services/types/schema";

import type {
  TGetResponseContent,
  TError,
  TPostResponseContent,
} from "@/services/types/schema";

const c = initContract();

export const supplierSchema = z.object({
  supplier_id: z.string(),
  supplier_name: z.string(),
  contact_info: z.object({
    phone: z.string(),
    email: z.string(),
    address: z.string(),
  }),
  remark: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createSupplierSchema = z.object({
  supplier_name: z.string().min(1),
  contact_info: z.object({
    phone: z.string().min(1),
    email: z.string().email(),
    address: z.string().min(1),
  }),
  remark: z.string().optional(),
});
export const updateSupplierSchema = supplierSchema.omit({
  created_at: true,
  updated_at: true,
});

export type TSupplier = z.infer<typeof supplierSchema>;
export type TCreateSupplier = z.infer<typeof createSupplierSchema>;
export type TUpdateSupplier = z.infer<typeof updateSupplierSchema>;

export const supplierQuerySchema = paginationSchema
  .merge(sortSchema.partial())
  .extend({
    search: z.string().optional(),
  });

export type TSupplierQuery = z.infer<typeof supplierQuerySchema>;

export const supplierContract = c.router({
  getAllSuppliers: {
    method: "GET",
    path: "/admin/supplier",
    responses: {
      200: c.type<TGetResponseContent<TSupplier[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getSuppliers: {
    method: "GET",
    path: "/admin/supplier",
    query: supplierQuerySchema,
    responses: {
      200: c.type<TGetResponseContent<TSupplier[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getSupplier: {
    method: "GET",
    path: "/admin/supplier",
    query: z.object({
      supplier_id: z.string(),
    }),
    responses: {
      200: c.type<TGetResponseContent<TSupplier>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  createSupplier: {
    method: "POST",
    path: "/admin/supplier",
    body: createSupplierSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateSupplier: {
    method: "PUT",
    path: "/admin/supplier",
    body: updateSupplierSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteSupplier: {
    method: "DELETE",
    path: "/admin/supplier",
    body: z.object({
      supplier_id: z.string(),
    }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
