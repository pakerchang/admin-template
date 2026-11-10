import type { corePermissions, TZodCatalog } from "./catalog";
import type { z } from "zod";

/**
 * 權限 registry（OD-TYPE-2 B，同 TRouteIdRegistry 手法）：core 自帶 `app:access`；
 * 各 module 在自己的 index.ts 以 `declare module "@/shared/permission"` augment。
 * 反映「檔案在 program 內」而非「已 .use()」→ build() 執行期檢查保留。
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TPermissionRegistry extends Record<
  z.infer<typeof corePermissions.schema>,
  true
> {}

/** role registry（OD-TYPE-6 A）：`app/mock/permission-matrix.ts` 以 coreRoles augment（shared 不 import app） */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TRoleRegistry {}

/** "orders:read"（冒號分隔，R17）；由 registry 推導 */
export type TPermission = Extract<keyof TPermissionRegistry, string>;
export type TResource = TPermission extends `${infer R}:${string}` ? R : never;
export type TRole = Extract<keyof TRoleRegistry, string>;
/** wildcard 只出現在矩陣資料 */
export type TGrant = TPermission | `${TResource}:*` | "*";

/** R13 中間格式；來源 = app/operations.gen.ts（§4.5、§6.5） */
export type OperationPermissions = Record<
  string /* operationId */,
  TPermission | "public"
>;
export type OperationRoute = {
  method: string;
  path: string /* "/admin/orders/:id" */;
  operationId: string;
};
export type TOperationTable = {
  routes: readonly OperationRoute[];
  permissions: OperationPermissions;
};

/** R21：module 宣告權限目錄 + 角色預設 grant；operation → permission 不在這裡 */
export type TModulePermissions = {
  /** Zod 權限目錄（單一來源，`definePermissions`） */
  catalog: TZodCatalog;
  /** 由 catalog 推出：{ orders: ["read","update","export"] }，含非 API 操作 */
  resources: Record<string, readonly string[]>;
  schema?: z.ZodType;
  /** 角色預設 grant，只給 mock 矩陣用 */
  mockGrants?: TGrantMatrix;
};
/** mock 端角色矩陣：roleId → grants（wildcard 保留，§6.1） */
export type TGrantMatrix = Partial<Record<TRole, readonly TGrant[]>>;
export type TPermissionCatalog = Record<string, readonly string[]>;
