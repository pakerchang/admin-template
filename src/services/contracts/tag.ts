import { initContract } from "@ts-rest/core";
import { z } from "zod";

import { paginationSchema, sortOrderEnum } from "@/services/types/schema";

import type {
  TGetResponseContent,
  TError,
  TPostResponseContent,
} from "@/services/types/schema";

const c = initContract();

export const tagSchema = z.object({
  tag_id: z.string(),
  tag_name: z.string(),
});

export const createTagSchema = z.object({
  tag_name: z.string().min(1),
});

export const updateTagSchema = z.object({
  tag_id: z.string(),
  tag_name: z.string().min(1),
});

export const deleteTagSchema = z.object({
  tag_id: z.string(),
});

export type TTag = z.infer<typeof tagSchema>;
export type TCreateTag = z.infer<typeof createTagSchema>;
export type TUpdateTag = z.infer<typeof updateTagSchema>;
export type TDeleteTag = z.infer<typeof deleteTagSchema>;

export const tagQuerySchema = paginationSchema
  .merge(
    z.object({
      sort_by: z.enum(["tag_id", "tag_name"]).optional(),
      order: sortOrderEnum.optional(),
    })
  )
  .extend({
    search: z.string().optional(),
  });

export type TTagQuery = z.infer<typeof tagQuerySchema>;

export const tagContract = c.router({
  getAllTags: {
    method: "GET",
    path: "/admin/tag",
    responses: {
      200: c.type<TGetResponseContent<TTag[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getTags: {
    method: "GET",
    path: "/admin/tag",
    query: tagQuerySchema,
    responses: {
      200: c.type<TGetResponseContent<TTag[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getTag: {
    method: "GET",
    path: "/admin/tag",
    query: z.object({
      tag_id: z.string(),
    }),
    responses: {
      200: c.type<TGetResponseContent<TTag>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  createTag: {
    method: "POST",
    path: "/admin/tag",
    body: createTagSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateTag: {
    method: "PUT",
    path: "/admin/tag",
    body: updateTagSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteTag: {
    method: "DELETE",
    path: "/admin/tag",
    body: deleteTagSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
