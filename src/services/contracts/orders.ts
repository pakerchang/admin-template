import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  paginationSchema,
  sortSchema,
  imageResponseSchema,
} from "@/services/types/schema";

import type {
  TGetResponseContent,
  TPostResponseContent,
  TError,
} from "@/services/types/schema";

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

export const orderStatusSchema = z.nativeEnum(EOrderStatus);

const c = initContract();

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
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type TOrder = z.infer<typeof baseOrderSchema>;

export const orderContract = c.router({
  getOrders: {
    method: "GET",
    path: "/admin/order",
    query: paginationSchema.merge(sortSchema.partial()).merge(
      z.object({
        order_status: orderStatusSchema.optional(),
      })
    ),
    responses: {
      200: c.type<TGetResponseContent<TOrder[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getOrder: {
    method: "GET",
    path: "/admin/order",
    query: baseOrderSchema.pick({ order_id: true }),
    responses: {
      200: c.type<TGetResponseContent<TOrder[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateOrder: {
    method: "POST",
    path: "/admin/order",
    body: baseOrderSchema.partial(),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateOrderStatus: {
    method: "POST",
    path: "/admin/order/update",
    body: baseOrderSchema.pick({ order_id: true, order_status: true }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteOrder: {
    method: "DELETE",
    path: "/orders/:orderId",
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});

export const batchOrderContract = c.router({
  getBatchOrders: {
    method: "GET",
    path: "/orders/batch",
    responses: {
      200: c.type<TGetResponseContent<TOrder[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getBatchOrder: {
    method: "GET",
    path: "/orders/batch/:orderId",
    responses: {
      200: c.type<TGetResponseContent<TOrder>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateBatchOrder: {
    method: "PUT",
    path: "/orders/batch/:orderId",
    body: baseOrderSchema.partial(),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteBatchOrder: {
    method: "DELETE",
    path: "/orders/batch/:orderId",
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
