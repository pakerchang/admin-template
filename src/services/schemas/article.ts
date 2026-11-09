import { z } from "zod";

import { imageResponseSchema } from "@/shared/api/schema";

export const articleSchema = z.object({
  article_id: z.string(),
  user_id: z.string(),
  nick_name: z.string(),
  title: z.string(),
  tags: z.array(z.string()).optional(),
  describe: z.string().optional(),
  image_url: imageResponseSchema,
  content_html: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type TArticle = z.infer<typeof articleSchema>;

export const articleFormSchema = articleSchema.omit({
  article_id: true,
  created_at: true,
  updated_at: true,
});

export type TArticleForm = z.infer<typeof articleFormSchema>;
