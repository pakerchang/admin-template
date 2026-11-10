import type { ColumnDef, VisibilityState } from "@tanstack/react-table";

export const TABLE_VISIBILITY_STORAGE_KEYS = {
  USERS_TABLE: "admin-dashboard:table-visibility:users",
  ORDERS_TABLE: "admin-dashboard:table-visibility:orders",
  PRODUCTS_TABLE: "admin-dashboard:table-visibility:products",
  CUSTOMERS_TABLE: "admin-dashboard:table-visibility:customers",
  ARTICLES_TABLE: "admin-dashboard:table-visibility:articles",
  TEAM_MEMBERS_TABLE: "admin-dashboard:table-visibility:team-members",
  SUPPLIERS_TABLE: "admin-dashboard:table-visibility:suppliers",
  TAGS_TABLE: "admin-dashboard:table-visibility:tags",
} as const;

export function getDefaultVisibility<TData = unknown>(
  columns: ColumnDef<TData>[]
): VisibilityState {
  const getColumnKey = (column: ColumnDef<TData>): string | null => {
    if ("accessorKey" in column && typeof column.accessorKey === "string") {
      return column.accessorKey;
    }
    if ("id" in column && typeof column.id === "string") {
      return column.id;
    }
    return null;
  };

  // 提取所有有效的欄位鍵值，預設都設為可見
  const defaultVisibility: VisibilityState = {};

  columns.forEach((column) => {
    const key = getColumnKey(column);
    if (key) {
      defaultVisibility[key] = true;
    }
  });

  return defaultVisibility;
}
