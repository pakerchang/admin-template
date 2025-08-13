import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { paginationSchema, sortSchema } from "@/services/types/schema";

import type {
  TGetResponseContent,
  TError,
  TPostResponseContent,
} from "@/services/types/schema";

const c = initContract();

export const staffUserSchema = z.object({
  staff_id: z.string(),
  account: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const createStaffUserSchema = z.object({
  account: z.string().min(1, "Account is required"),
  email: z.string().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.string().min(1, "Role is required"),
});

export type TStaffUser = z.infer<typeof staffUserSchema>;
export type TCreateStaffUser = z.infer<typeof createStaffUserSchema>;

export const staffQuerySchema = paginationSchema
  .merge(sortSchema.partial())
  .extend({
    role: z.string().optional(),
    staff_id: z.string().optional(),
  });

export type TStaffQuery = z.infer<typeof staffQuerySchema>;

export const staffContract = c.router({
  getStaff: {
    method: "GET",
    path: "/admin/staff",
    query: staffQuerySchema,
    responses: {
      200: c.type<TGetResponseContent<TStaffUser[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  createStaff: {
    method: "POST",
    path: "/admin/staff",
    body: createStaffUserSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateStaff: {
    method: "PUT",
    path: "/admin/staff",
    body: staffUserSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteStaff: {
    method: "DELETE",
    path: "/admin/staff",
    body: z.object({
      staff_id: z.string(),
    }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
