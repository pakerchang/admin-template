import { z } from "zod";

import { paginationSchema, sortOrderEnum } from "@/services/types/schema";

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
