/**
 * hand-maintained until M7 —— M7 起由 `scripts/extract-operations.ts` 從 openapi.yaml 產生並覆蓋（spec §4.5、§6.5、R15）。
 * 每個 `src/services/mock/handlers.ts` 的 `METHOD path` 一條 route；permission 必須是已安裝 module 權限目錄中完整的
 * `resource:action`，或顯式 "public"（build() 驗證 1.5，fail-closed）。
 */
import type { TOperationTable } from "@/shared/permission";

const crud = (resource: string, path: string, name: string) => ({
  [`GET ${path}`]: [`list${name}s`, `${resource}:read`],
  [`POST ${path}`]: [`create${name}`, `${resource}:create`],
  [`PUT ${path}`]: [`update${name}`, `${resource}:update`],
  [`DELETE ${path}`]: [`delete${name}`, `${resource}:delete`],
});

/** `METHOD path` → [operationId, permission] */
const table: Record<string, [string, string]> = {
  "POST /api/auth/login": ["login", "public"],

  "GET /users": ["listUsers", "users:read"],
  // 登入者自己的 profile：任何進得了後台的人都可讀寫自己
  "GET /user/me/profile": ["getMyProfile", "app:access"],
  "PUT /user/me/profile": ["updateMyProfile", "app:access"],
  "POST /admin/user/role": ["updateUserRole", "users:update-role"],

  "GET /admin/products": ["listProducts", "product:read"],
  "POST /admin/products": ["createProduct", "product:create"],
  "POST /admin/products/update": ["updateProduct", "product:update"],
  "DELETE /admin/products": ["deleteProduct", "product:delete"],

  // R29 kernel 自有（core）：通用上傳，product / banners / articles 表單共用
  "POST /admin/images": ["uploadImage", "app:access"],
  "DELETE /admin/images": ["deleteImage", "app:access"],

  "GET /admin/order": ["listOrders", "orders:read"],
  "POST /admin/order": ["saveOrder", "orders:update"],
  "POST /admin/order/update": ["updateOrder", "orders:update"],

  ...crud("banners", "/admin/banners", "Banner"),

  "GET /admin/customers": ["listCustomers", "consumers:read"],
  "GET /admin/transaction_history": [
    "listTransactionHistory",
    "consumers:read",
  ],

  ...crud("suppliers", "/admin/supplier", "Supplier"),
  ...crud("tags", "/admin/tag", "Tag"),
  ...crud("team-members", "/admin/staff", "Staff"),
  ...crud("articles", "/admin/articles", "Article"),
};

const entries = Object.entries(table);

export const operations: TOperationTable = {
  routes: entries.map(([key, [operationId]]) => {
    const [method, path] = key.split(" ");
    return { method, path, operationId };
  }),
  permissions: Object.fromEntries(
    entries.map(([, [operationId, permission]]) => [operationId, permission])
  ) as TOperationTable["permissions"],
};
