import { http, HttpResponse, matchRequestUrl, type HttpHandler } from "msw";

/** 中間格式：core/guard 只認這個。operationId → 所需 permission。 */
export type OperationPermissions = Record<string, string>;

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
  return { routes, permissions };
};

// ---- core guard：只讀中間格式 ----
export const createPermissionGuard = (opts: {
  routes: OperationRoute[];
  permissions: OperationPermissions;
  getGranted: (request: Request) => ReadonlySet<string>;
}): HttpHandler =>
  http.all("*", ({ request }) => {
    const route = opts.routes.find(
      (r) => r.method === request.method && matchRequestUrl(new URL(request.url), `*${r.path}`).matches // 與 orval 產的 `*/path` 同規則
    );
    // ponytail: 沒對到 operation 或沒宣告 permission → 視為公開、fall through；要 fail-closed 改成這裡回 403
    const required = route && opts.permissions[route.operationId];
    if (!required || opts.getGranted(request).has(required)) return;
    return HttpResponse.json({ error: `forbidden: ${route.operationId} requires ${required}` }, { status: 403 });
  });
