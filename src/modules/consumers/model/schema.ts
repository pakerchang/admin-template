import { z } from "zod";

import {
  paginationSchema,
  imageResponseSchema,
  sortOrderEnum,
} from "@/shared/api/schema";

import { OrderStatus } from "../api/model";

// R5 / spec §5.2：consumers 不 requires orders，交易紀錄的聯絡資訊形狀自帶
const contactInfoSchema = z.object({
  address: z.string(),
  phone: z.string(),
  email: z.string(),
});

export const customerSchema = z.object({
  user_id: z.string(),
  email: z.email(),
  first_name: z.string(),
  last_name: z.string(),
  phone_number: z.string(),
  total_spent: z.number(),
  order_count: z.number(),
  last_order_date: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
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
  created_at: z.string().optional(),
  order_detail: z.array(orderDetailItemSchema),
  order_status: z.enum(OrderStatus),
  remark: z.string(),
  delivery_fee: z.string(),
  delivery_note: z.string(),
  delivery_time: z.string(),
  total_order_fee: z.string(),
  updated_at: z.string().optional(),
  user_id: z.string(),
});

export const transactionHistoryQuerySchema = paginationSchema.extend({
  user_id: z.string(),
});

export type TTransactionHistoryOrder = z.infer<
  typeof transactionHistoryOrderSchema
>;
export type TTransactionHistoryQuery = z.infer<
  typeof transactionHistoryQuerySchema
>;
