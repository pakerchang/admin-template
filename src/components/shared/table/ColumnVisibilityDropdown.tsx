import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import type { ColumnVisibilityDropdownProps } from "./table-visibility";
import type { Column } from "@tanstack/react-table";

// 提取為組件外部的純函數，提升可讀性和可測試性
function getColumnDisplayName<TData>(column: Column<TData>): string {
  // 優先使用 meta.displayName（用於翻譯後的名稱）
  if (column.columnDef.meta?.displayName) {
    return column.columnDef.meta.displayName;
  }

  const { header } = column.columnDef;

  // 如果 header 是字串，直接使用
  if (typeof header === "string") {
    return header;
  }

  // 如果 header 是函數或其他類型，使用 columnId
  // 避免調用 header 函數，因為需要複雜的 context 參數
  return column.id;
}

export function ColumnVisibilityDropdown<TData = unknown>({
  table,
  align = "end",
}: ColumnVisibilityDropdownProps<TData>) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 size-4" />
          {t("table.columnVisibility")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        <DropdownMenuLabel>{t("table.showHideColumns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(checked) => column.toggleVisibility(checked)}
            >
              {getColumnDisplayName(column)}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
