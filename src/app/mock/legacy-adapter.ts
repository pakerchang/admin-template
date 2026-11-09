import { delay, http, HttpResponse } from "msw";

import { DELAY_MS } from "@/services/mock/handlers";

import type { THandler } from "@/services/mock/handlers";
import type { TOperationTable } from "@/shared/permission";
import type { HttpHandler } from "msw";

type TMethod = "get" | "post" | "put" | "delete";

/** 把舊的 `METHOD path` 表包成 MSW resolver：讀 query / JSON body → 延遲 → 呼叫 handler */
const resolve =
  (fn: THandler) =>
  async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const text = await request.text();
    await delay(DELAY_MS);
    const { status = 200, body } = fn({
      query: Object.fromEntries(url.searchParams),
      body: text ? JSON.parse(text) : {},
    });
    return HttpResponse.json(body ?? null, { status });
  };

export const toHttpHandlers = (
  table: Record<string, THandler>,
  { baseUrl }: { baseUrl: string }
): HttpHandler[] =>
  Object.entries(table).map(([key, fn]) => {
    const [method, path] = key.split(" ");
    // 與 apiFetch 同樣用 new URL(path, base) 解析
    return http[method.toLowerCase() as TMethod](
      new URL(path, baseUrl).href,
      resolve(fn)
    );
  });

/**
 * M3 過渡 operation 表（R28）：舊表每個 `METHOD path` 一條 route，operationId 即該 key，permission 一律 "public"。
 * guard 據此「表內放行、表外 404」，等同舊 mock client 的 404 fallback。M4 換成手寫 app/operations.gen.ts。
 */
export const legacyOperations = (
  table: Record<string, THandler>
): TOperationTable => {
  const keys = Object.keys(table);
  return {
    routes: keys.map((key) => {
      const [method, path] = key.split(" ");
      return { method, path, operationId: key };
    }),
    permissions: Object.fromEntries(keys.map((key) => [key, "public"])),
  };
};
