import type { HttpHandler } from "msw";

/**
 * R24：mock 模式的 apiBaseUrl 必須是專用的絕對 origin。未設定、不是絕對 URL、與 app 同源（不論路徑）→ throw。
 * 同源非根（`location.origin + "/api"`）也擋：client 以絕對路徑組 URL，`/users` 會落到 origin 根、出了 guard 範圍。
 */
export const assertMockApiBaseUrl = (
  apiBaseUrl: string | undefined,
  appOrigin: string
) => {
  if (!apiBaseUrl)
    throw new Error(
      "mock mode requires VITE_API_BASE_URL to be a dedicated absolute origin (e.g. http://mock-api.local)"
    );
  let origin: string;
  try {
    origin = new URL(apiBaseUrl).origin;
  } catch {
    throw new Error(
      `mock mode: VITE_API_BASE_URL "${apiBaseUrl}" is not an absolute URL`
    );
  }
  if (origin === appOrigin)
    throw new Error(
      `mock mode: VITE_API_BASE_URL "${apiBaseUrl}" must not share the app origin ${appOrigin}`
    );
};

type TStart = (handlers: HttpHandler[]) => Promise<unknown>;

/** `start` 由呼叫端注入（browser 端見 app/mock/browser.ts）：msw/browser 不能進 node 測試的 import 圖 */
export const startMockWorker = async (
  handlers: HttpHandler[],
  {
    apiBaseUrl,
    appOrigin,
    start,
  }: { apiBaseUrl: string | undefined; appOrigin: string; start: TStart }
) => {
  assertMockApiBaseUrl(apiBaseUrl, appOrigin);
  await start(handlers);
};
