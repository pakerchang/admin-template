import { http, HttpResponse } from "msw";

import { can } from "@/shared/permission";

import type {
  OperationRoute,
  TGrant,
  TOperationTable,
} from "@/shared/permission";
import type { HttpHandler } from "msw";

const matchPath = (pattern: string, path: string) => {
  const [a, b] = [pattern.split("/"), path.split("/")];
  return (
    a.length === b.length && a.every((s, i) => s.startsWith(":") || s === b[i])
  );
};

const matchOperation = (
  routes: readonly OperationRoute[],
  method: string,
  path: string
) =>
  routes.find(
    (r) => r.method.toUpperCase() === method && matchPath(r.path, path)
  );

/**
 * R22 判定（spec §6.5）：apiBaseUrl 外放行 → 對不到 route 404 → 未宣告 403 → public 放行 → 無權限 403 → 有權限 fall through。
 * apiBaseUrl 劃界用正規化 origin 比對（host 小寫、去預設 port；R24 起 base 必為純 origin），等同 spec「前綴補 /」：
 * `http://api.test` 不會吃到 `http://api.testing/...`，帶不帶結尾 `/` 結果相同。
 */
export const createPermissionGuard = ({
  routes,
  permissions,
  apiBaseUrl,
  getGrants,
}: TOperationTable & {
  apiBaseUrl: string;
  /** 未帶 token / 查無 session = []（R25：403，不回 401） */
  getGrants: (request: Request) => readonly TGrant[];
}): HttpHandler => {
  const origin = new URL(apiBaseUrl).origin;
  return http.all("*", ({ request }) => {
    const url = new URL(request.url);
    if (url.origin !== origin) return;
    const path = url.pathname;
    const route = matchOperation(routes, request.method, path);
    if (!route)
      // 沿用舊 mock client 的 404 body（mock API 回應 body 不變）
      return HttpResponse.json(
        { error: `No mock handler for ${request.method} ${path}` },
        { status: 404 }
      );
    const required = permissions[route.operationId];
    if (required === undefined)
      return HttpResponse.json(
        {
          error: `forbidden: ${route.operationId} has no permission declaration`,
        },
        { status: 403 }
      );
    if (required === "public") return;
    if (!can(getGrants(request), required))
      return HttpResponse.json(
        { error: `forbidden: ${route.operationId} requires ${required}` },
        { status: 403 }
      );
  });
};
