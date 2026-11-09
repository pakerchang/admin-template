import { delay, http, HttpResponse } from "msw";

import type { HttpHandler } from "msw";

type THandlerContext = {
  query: Record<string, string>;
  body: Record<string, unknown>;
  /** request 的 Authorization header */
  authorization?: string | null;
};
type THandlerResult = { status?: number; body?: unknown };
export type THandler = (ctx: THandlerContext) => THandlerResult;

export const DELAY_MS = import.meta.env.MODE === "test" ? 0 : 300;

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
      authorization: request.headers.get("Authorization"),
    });
    return HttpResponse.json(body ?? null, { status });
  };

/**
 * 過渡 adapter（spec §4.5，M2 起；M7b 換 orval 產物後刪除）：`METHOD path` 表 → MSW `HttpHandler[]`。
 * M6 起住 shared：各 module 的 `mocks/handlers.ts` 與 kernel 的 core handler 都用它（module 不可 import app）。
 */
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
