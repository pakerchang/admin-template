import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  activeStatusEnums,
  imageResponseSchema,
  paginationSchema,
} from "@/services/types/schema";

import type {
  TError,
  TGetResponseContent,
  TPostResponseContent,
} from "@/services/types/schema";

const c = initContract();

export const bannerSchema = z.object({
  banner_id: z.string(),
  title: z.string(),
  desktop_image_url: imageResponseSchema,
  mobile_image_url: imageResponseSchema,
  redirect_url: z.string().url(),
  sort_order: z.number(),
  banner_status: activeStatusEnums,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type TBanner = z.infer<typeof bannerSchema>;

export const bannerContract = c.router({
  getBanners: {
    method: "GET",
    path: "/admin/banners",
    query: paginationSchema,
    responses: {
      200: c.type<TGetResponseContent<TBanner[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getBanner: {
    method: "GET",
    path: "/admin/banners",
    query: bannerSchema.pick({ banner_id: true }),
    responses: {
      200: c.type<TGetResponseContent<TBanner[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  createBanner: {
    method: "POST",
    path: "/admin/banners",
    body: bannerSchema.omit({
      banner_id: true,
      created_at: true,
      updated_at: true,
    }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateBanner: {
    method: "PUT",
    path: "/admin/banners",
    body: bannerSchema.omit({
      created_at: true,
      updated_at: true,
    }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteBanner: {
    method: "DELETE",
    path: "/admin/banners",
    body: bannerSchema.pick({ banner_id: true }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
