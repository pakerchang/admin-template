import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { paginationSchema, sortSchema } from "../types/schema";

import type { TGetResponseContent, TError } from "../types/schema";

const c = initContract();

export const userRoleEnum = z.enum([
  "guest",
  "user",
  "premium",
  "partner",
  "support",
  "admin",
  "superadmin",
]);
export type TUserRole = z.infer<typeof userRoleEnum>;

export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone_number: z
    .string()
    .min(1)
    .regex(/^[0-9]{10}$/, "Invalid phone number format"),
  address: z.string().min(1),
  remark: z.string(),
  role: userRoleEnum,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type TUser = z.infer<typeof userSchema>;

export const userContract = c.router({
  getUserList: {
    method: "GET",
    path: "/users",
    query: paginationSchema.merge(sortSchema.partial()),
    responses: {
      200: c.type<TGetResponseContent<TUser[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getUserProfile: {
    method: "GET",
    path: "/user/me/profile",
    responses: {
      200: c.type<TUser>(),
    },
  },
  getUserRole: {
    method: "GET",
    path: "/user/role",
    responses: {
      200: c.type<{
        role: TUserRole;
        code: number;
        error: string;
        msg: string;
      }>(),
    },
  },
  updateUserRole: {
    method: "POST",
    path: "/admin/user/role",
    body: z.object({
      target_user_id: userSchema.shape.user_id,
      role: userRoleEnum,
    }),
    responses: {
      200: c.type<
        TGetResponseContent<{
          role: TUserRole;
          code: number;
          error: string;
          msg: string;
        }>
      >(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateUserProfile: {
    method: "PUT",
    path: "/user/me/profile",
    body: userSchema.omit({
      created_at: true,
      updated_at: true,
    }),
    responses: {
      200: c.type<TGetResponseContent<TUser>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
