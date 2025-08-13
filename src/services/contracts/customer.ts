import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { contactInfoSchema } from "@/services/contracts/orders";
import {
  paginationSchema,
  imageResponseSchema,
  sortOrderEnum,
} from "@/services/types/schema";

import type { TGetResponseContent, TError } from "@/services/types/schema";

const c = initContract();

export const customerSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone_number: z.string(),
  total_spent: z.number(),
  order_count: z.number(),
  last_order_date: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export type TCustomer = z.infer<typeof customerSchema>;

export const customerSortByEnum = z.enum(["total_spent", "order_count"]);

export const customerQuerySchema = paginationSchema.extend({
  user_id: z.string().optional(),
  sort_by: customerSortByEnum.optional(),
  order: sortOrderEnum.optional(),
});

export type TCustomerQuery = z.infer<typeof customerQuerySchema>;

export const orderDetailItemSchema = z.object({
  promotion_note: z.string(),
  order_id: z.string(),
  price: z.string(),
  product_id: z.string(),
  product_images: z.array(imageResponseSchema),
  product_name: z.string(),
  size: z.string(),
});

export const transactionHistoryOrderSchema = z.object({
  order_id: z.string(),
  vendor_id: z.string(),
  contact_info: contactInfoSchema,
  created_at: z.string(),
  order_detail: z.array(orderDetailItemSchema),
  order_status: z.string(),
  remark: z.string().optional(),
  delivery_fee: z.string(),
  delivery_note: z.string(),
  delivery_time: z.string(),
  total_order_fee: z.string(),
  updated_at: z.string(),
  user_id: z.string(),
});

export const orderStatusEnum = z.enum(["pending", "completed", "cancelled"]);
export type TOrderStatus = z.infer<typeof orderStatusEnum>;

export const transactionHistoryQuerySchema = paginationSchema.extend({
  user_id: z.string(),
});

export const transactionHistoryResponseSchema = z.object({
  code: z.number(),
  data: z.array(transactionHistoryOrderSchema),
  msg: z.string(),
  total: z.number(),
});

export type TTransactionHistoryOrder = z.infer<
  typeof transactionHistoryOrderSchema
>;
export type TTransactionHistoryQuery = z.infer<
  typeof transactionHistoryQuerySchema
>;
export type TTransactionHistoryResponse = z.infer<
  typeof transactionHistoryResponseSchema
>;

export const customerContract = c.router({
  getCustomers: {
    method: "GET",
    path: "/admin/customers",
    query: customerQuerySchema,
    responses: {
      200: c.type<TGetResponseContent<TCustomer[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getTransactionHistory: {
    method: "GET",
    path: "/admin/transaction_history",
    query: transactionHistoryQuerySchema,
    responses: {
      200: c.type<TTransactionHistoryResponse>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
