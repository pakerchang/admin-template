import { delay, http, HttpResponse } from "msw";

import { DELAY_MS } from "@/services/mock/handlers";

import type { THandler } from "@/services/mock/handlers";
import type { HttpHandler } from "msw";

type TMethod = "get" | "post" | "put" | "delete";

/**
 * 把舊的 `METHOD path` 表包成 MSW resolver：讀 query / JSON body → 延遲 → 呼叫 handler。
 * 頁面導覽（`mode: navigate`）一律放行：msw 3 的 worker 也會攔 navigation，
 * 同源 base 時 `/users` 頁面重新整理會撞上 `GET /users`。
 * ponytail: M3 改專用 mock origin（R24）後此判斷可刪。
 */
const resolve =
  (fn: THandler) =>
  async ({ request }: { request: Request }) => {
    if (request.mode === "navigate") return;
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
    return http[method.toLowerCase() as TMethod](
      `${baseUrl}${path}`,
      resolve(fn)
    );
  });

/**
 * 對應舊 mockFetch 的「查無 handler 回 404」。只罩住表內出現過的頂層前綴（/api /users /user /admin），
 * 同源 base 時才不會吃掉 vite 資源；必須排在 toHttpHandlers 之後。
 */
export const toNotFoundHandlers = (
  table: Record<string, THandler>,
  { baseUrl }: { baseUrl: string }
): HttpHandler[] => {
  const prefixes = new Set(
    Object.keys(table).map((key) => key.split(" ")[1].split("/")[1])
  );
  return [...prefixes].flatMap((prefix) =>
    [`${baseUrl}/${prefix}`, `${baseUrl}/${prefix}/*`].map((path) =>
      http.all(path, ({ request }) =>
        resolve(() => ({
          status: 404,
          body: {
            error: `No mock handler for ${request.method} ${new URL(request.url).pathname}`,
          },
        }))({ request })
      )
    )
  );
};
