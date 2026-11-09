import { delay, http, HttpResponse } from "msw";

import { DELAY_MS } from "@/services/mock/handlers";

import type { THandler } from "@/services/mock/handlers";
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
