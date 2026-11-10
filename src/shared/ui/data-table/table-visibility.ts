import type { ColumnDef, Table, VisibilityState } from "@tanstack/react-table";

export interface UseColumnVisibilityOptions<TData = unknown> {
  columns: ColumnDef<TData>[];
  storageKey: string;
  defaultVisibility?: VisibilityState;
}

export interface ColumnVisibilityDropdownProps<TData = unknown> {
  table: Table<TData>;
  align?: "start" | "end";
}

export interface TableVisibilityStorage {
  hasCustomSettings: boolean;
  visibility: VisibilityState;
}

export interface UseColumnVisibilityReturn {
  columnVisibility: VisibilityState;
  setColumnVisibility: (visibility: VisibilityState) => void;
  resetToDefault: () => void;
  hasCustomSettings: boolean;
}
