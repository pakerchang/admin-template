import { delay, http, HttpResponse } from "msw";

import { DELAY_MS } from "@/services/mock/handlers";
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
 * ponytail: 先住 app/mock；M4 依 spec 移到 shared/api/mock/permission-guard.ts 並接 session grants。
 */
export const createPermissionGuard = ({
  routes,
  permissions,
  apiBaseUrl,
  getGrants,
}: TOperationTable & {
  apiBaseUrl: string;
  getGrants: (request: Request) => readonly TGrant[];
}): HttpHandler => {
  // 與 client / handler 的 new URL(path, base) 同一套正規化（host 小寫、去預設 port）；base 須為純 origin（start-worker 驗）
  const origin = new URL(apiBaseUrl).origin;
  return http.all("*", async ({ request }) => {
    const url = new URL(request.url);
    if (url.origin !== origin) return;
    const path = url.pathname;
    const route = matchOperation(routes, request.method, path);
    if (!route) {
      await delay(DELAY_MS);
      // 沿用舊 mock client 的 404 body（行為不變）
      return HttpResponse.json(
        { error: `No mock handler for ${request.method} ${path}` },
        { status: 404 }
      );
    }
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
