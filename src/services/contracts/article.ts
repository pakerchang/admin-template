import { initContract } from "@ts-rest/core";
import { z } from "zod";

import {
  imageResponseSchema,
  paginationSchema,
  sortSchema,
} from "@/services/types/schema";

import type {
  TError,
  TGetResponseContent,
  TPostResponseContent,
} from "@/services/types/schema";

const c = initContract();

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

export const articleContract = c.router({
  getArticles: {
    method: "GET",
    path: "/admin/articles",
    query: paginationSchema.merge(sortSchema.partial()),
    responses: {
      200: c.type<TGetResponseContent<TArticle[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  getArticle: {
    method: "GET",
    path: "/admin/articles",
    query: articleSchema.pick({ article_id: true }),
    responses: {
      200: c.type<TGetResponseContent<TArticle[]>>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  createArticle: {
    method: "POST",
    path: "/admin/articles",
    body: articleFormSchema,
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  updateArticle: {
    method: "PUT",
    path: "/admin/articles",
    body: articleSchema.omit({
      created_at: true,
      updated_at: true,
    }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
  deleteArticle: {
    method: "DELETE",
    path: "/admin/articles",
    body: articleSchema.pick({ article_id: true }),
    responses: {
      200: c.type<TPostResponseContent>(),
      400: c.type<TError>(),
      500: c.type<TError>(),
    },
  },
});
