/** "orders:read"（冒號分隔，R17） */
export type TPermission = `${string}:${string}`;
/** wildcard 只出現在矩陣資料 */
export type TGrant = TPermission | `${string}:*` | "*";

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
  /** 權限目錄：{ orders: ["read","update","export"] }，含非 API 操作 */
  resources: Record<string, readonly string[]>;
  /** 角色預設 grant，只給 mock 矩陣用 */
  mockGrants?: Record<string /* roleId */, TGrant[]>;
};
export type TPermissionCatalog = Record<string, readonly string[]>;
