import { z } from "zod";

export type TPostResponseContent = {
  message: string;
};

export type TGetResponseContent<T = void> = {
  code: number;
  msg: string;
  error: string;
  data?: T;
  total?: number;
};

export type TError = {
  error: string;
};

export const langSchema = z.object({
  zh: z.string(),
  th: z.string(),
  en: z.string(),
});

export const imageSchema = z.object({
  file_name: z.string(),
  file_value: z.string(),
});

export const imageResponseSchema = z.object({
  file_name: z.string(),
  file_url: z.string(),
});

export const paginationSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
});

export const sortOrderEnum = z.enum(["ASC", "DESC"]);

export const sortSchema = z.object({
  sort_by: z.string(),
  order: sortOrderEnum,
});

export const activeStatusEnums = z.enum(["active", "inactive"]);

export type TLang = z.infer<typeof langSchema>;
export type TLangContent = z.infer<typeof langSchema>;
export type TImageSchema = z.infer<typeof imageSchema>;
export type TImageResponseSchema = z.infer<typeof imageResponseSchema>;
export type TPagination = z.infer<typeof paginationSchema>;
export type TSortOrder = z.infer<typeof sortOrderEnum>;
export type EActiveStatus = z.infer<typeof activeStatusEnums>;
