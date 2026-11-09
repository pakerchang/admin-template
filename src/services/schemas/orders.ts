import { z } from "zod";

import { imageResponseSchema } from "@/services/types/schema";

export enum EOrderStatus {
  NEW = "new",
  PENDING = "pending",
  PAID = "paid",
  SHIPPED = "shipped",
  REFUNDED = "refunded",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum EShipped {
  SELF_PICKUP = "self_pickup",
  EXPRESS = "express",
}

export const orderStatusSchema = z.enum(EOrderStatus);

export const contactInfoSchema = z.object({
  address: z.string(),
  phone: z.string(),
  email: z.string(),
});

export type TContactInfo = z.infer<typeof contactInfoSchema>;

export const orderItemSchema = z.object({
  product_name: z.string(),
  product_id: z.string(),
  size: z.string(),
  price: z.string(),
  order_id: z.string(),
  promotion_note: z.string(),
  product_images: z.array(imageResponseSchema),
});
export type TOrderItem = z.infer<typeof orderItemSchema>;

export const baseOrderSchema = z.object({
  vendor_id: z.string(),
  order_id: z.string(),
  order_detail: z.array(orderItemSchema),
  order_status: orderStatusSchema,
  contact_info: contactInfoSchema,
  remark: z.string(),
  delivery_fee: z.string(),
  delivery_note: z.string(),
  delivery_time: z.string(),
  total_order_fee: z.string(),
  user_id: z.string(),
  created_at: z.iso.datetime().optional(),
  updated_at: z.iso.datetime().optional(),
});

export type TOrder = z.infer<typeof baseOrderSchema>;
