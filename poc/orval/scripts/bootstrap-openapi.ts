// 一次性 bootstrap：repo 現有 Zod schema → openapi.yaml。之後 YAML 是唯一真相，這支用完即丟。
import { writeFileSync } from "node:fs";
import { z } from "zod";
import { createDocument } from "zod-openapi";
import { stringify } from "yaml";

import { bannerSchema } from "@/services/schemas/banner";
import { userSchema } from "@/services/schemas/user";

const envelope = (data: z.ZodTypeAny) =>
  z.object({
    code: z.number(),
    msg: z.string(),
    error: z.string(),
    data: data.optional(),
    total: z.number().optional(),
  });
const messageBody = z.object({ message: z.string() });
const errorBody = z.object({ error: z.string() });
const listQuery = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
  search: z.string().optional(),
  sort_by: z.string().optional(),
  order: z.enum(["ASC", "DESC"]).optional(),
});
const createBannerBody = bannerSchema.omit({
  banner_id: true,
  created_at: true,
  updated_at: true,
});

const json = (schema: z.ZodTypeAny, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const forbidden = json(errorBody, "Forbidden");

const doc = createDocument({
  openapi: "3.1.0",
  info: { title: "admin-template API", version: "0.0.0" },
  tags: [{ name: "banners" }, { name: "users" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    schemas: { Banner: bannerSchema, User: userSchema, ErrorBody: errorBody },
  },
  paths: {
    "/admin/banners": {
      get: {
        operationId: "listBanners",
        tags: ["banners"],
        "x-permission": "banners:read",
        requestParams: { query: listQuery },
        responses: {
          "200": json(envelope(z.array(bannerSchema)), "Banner list"),
          "403": forbidden,
        },
      },
      post: {
        operationId: "createBanner",
        tags: ["banners"],
        "x-permission": "banners:manage",
        requestBody: { content: { "application/json": { schema: createBannerBody } } },
        responses: {
          "200": json(messageBody, "Created"),
          "403": forbidden,
        },
      },
    },
    "/users": {
      get: {
        operationId: "listUsers",
        tags: ["users"],
        "x-permission": "users:read",
        requestParams: { query: listQuery },
        responses: {
          "200": json(envelope(z.array(userSchema)), "User list"),
          "403": forbidden,
        },
      },
    },
  },
});

writeFileSync(new URL("../openapi.yaml", import.meta.url), stringify(doc, { aliasDuplicateObjects: false }));
console.log("wrote openapi.yaml");
