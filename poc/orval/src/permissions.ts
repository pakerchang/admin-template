import { http, HttpResponse, matchRequestUrl, type HttpHandler } from "msw";

/** 中間格式：core/guard 只認這個。operationId → 所需 permission；公開的 operation 明確標 PUBLIC。 */
export type OperationPermissions = Record<string, string>;

/** 保留字：不需任何權限。module 宣告與 YAML `x-permission: public` 用同一個字面值。 */
export const PUBLIC = "public";

/** 完整性檢查（fail-closed 的開發期那一半）：每個 route 都必須有宣告，否則 throw 並列出 operationId。 */
export const assertPermissionsComplete = (routes: OperationRoute[], permissions: OperationPermissions) => {
  const missing = routes.filter((r) => !permissions[r.operationId]).map((r) => r.operationId);
  if (missing.length) throw new Error(`missing permission declaration (x-permission / module permissions) for: ${missing.join(", ")}`);
};

/** guard 用來把 request 對回 operationId 的路由表（由 gen script 從 YAML 產出）。 */
export type OperationRoute = { method: string; path: string; operationId: string };

// ---- 來源 (a)：module 宣告 ----
export type AppModule = {
  id: string;
  mockHandlers: HttpHandler[];
  permissions?: OperationPermissions;
};

export const fromModules = (modules: AppModule[]): OperationPermissions => {
  const out: OperationPermissions = {};
  for (const m of modules) {
    for (const [op, perm] of Object.entries(m.permissions ?? {})) {
      if (out[op] && out[op] !== perm) {
        throw new Error(`permission conflict on ${op}: ${out[op]} vs ${perm} (module ${m.id})`);
      }
      out[op] = perm;
    }
  }
  return out;
};

// ---- 來源 (b)：YAML x-permission ----
const METHODS = ["get", "post", "put", "patch", "delete"] as const;
type OpenApiDoc = {
  paths: Record<string, Partial<Record<string, { operationId?: string; "x-permission"?: string }>>>;
};

export const fromOpenApi = (doc: OpenApiDoc) => {
  const routes: OperationRoute[] = [];
  const permissions: OperationPermissions = {};
  for (const [path, item] of Object.entries(doc.paths)) {
    for (const method of METHODS) {
      const op = item[method];
      if (!op?.operationId) continue;
      // OpenAPI `{id}` → msw `:id`
      routes.push({ method: method.toUpperCase(), path: path.replace(/\{(\w+)\}/g, ":$1"), operationId: op.operationId });
      if (op["x-permission"]) permissions[op.operationId] = op["x-permission"];
    }
  }
  assertPermissionsComplete(routes, permissions); // gen 時就失敗，不等 runtime 403
  return { routes, permissions };
};

// ---- core guard：只讀中間格式，fail-closed ----
export const createPermissionGuard = (opts: {
  routes: OperationRoute[];
  permissions: OperationPermissions;
  getGranted: (request: Request) => ReadonlySet<string>;
  /** API 的 base URL；只有它底下的 request 受 guard 管，其餘（vite/HMR/靜態檔/第三方）放行 */
  apiBaseUrl: string;
}): HttpHandler => {
  const base = opts.apiBaseUrl.endsWith("/") ? opts.apiBaseUrl : `${opts.apiBaseUrl}/`; // 防 http://api.test 誤吃 http://api.testing
  return http.all("*", ({ request }) => {
    if (!request.url.startsWith(base)) return;
    const route = opts.routes.find(
      (r) => r.method === request.method && matchRequestUrl(new URL(request.url), `*${r.path}`).matches // 與 orval 產的 `*/path` 同規則
    );
    if (!route) {
      return HttpResponse.json({ error: `not found: no operation for ${request.method} ${new URL(request.url).pathname}` }, { status: 404 });
    }
    const required = opts.permissions[route.operationId];
    if (!required) {
      return HttpResponse.json({ error: `forbidden: ${route.operationId} has no permission declaration` }, { status: 403 });
    }
    if (required === PUBLIC || opts.getGranted(request).has(required)) return;
    return HttpResponse.json({ error: `forbidden: ${route.operationId} requires ${required}` }, { status: 403 });
  });
};
