import { z } from "zod";

import { paginationSchema, sortSchema } from "@/shared/api/schema";

export const supplierSchema = z.object({
  supplier_id: z.string(),
  supplier_name: z.string(),
  contact_info: z.object({
    phone: z.string(),
    email: z.string(),
    address: z.string(),
  }),
  remark: z.string().optional(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const createSupplierSchema = z.object({
  supplier_name: z.string().min(1),
  contact_info: z.object({
    phone: z.string().min(1),
    email: z.email(),
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
  .extend(sortSchema.partial().shape)
  .extend({
    search: z.string().optional(),
  });

export type TSupplierQuery = z.infer<typeof supplierQuerySchema>;
