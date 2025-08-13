import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ColumnVisibilityDropdown, useColumnVisibility } from "./table";

import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  initialState?: {
    columnVisibility?: VisibilityState;
  };
  pagination?: {
    state: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    total: number;
    pageSizeOptions?: number[];
  };
  enableColumnVisibility?: boolean;
  columnVisibilityStorageKey?: string;
  columnVisibilityAlign?: "start" | "end";
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
}

const DataTable = <T,>({
  data,
  columns,
  isLoading,
  initialState,
  pagination,
  enableColumnVisibility = false,
  columnVisibilityStorageKey,
  columnVisibilityAlign = "end",
  sorting,
  onSortingChange,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange: externalOnColumnFiltersChange,
}: DataTableProps<T>) => {
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  const columnFilters = externalColumnFilters ?? internalColumnFilters;
  const onColumnFiltersChange =
    externalOnColumnFiltersChange ?? setInternalColumnFilters;

  const columnVisibilityHook = useColumnVisibility({
    columns,
    storageKey: columnVisibilityStorageKey || "default",
    defaultVisibility: initialState?.columnVisibility,
  });

  const [fallbackColumnVisibility, setFallbackColumnVisibility] =
    useState<VisibilityState>(initialState?.columnVisibility || {});

  const shouldUseColumnVisibilityHook =
    enableColumnVisibility && columnVisibilityStorageKey;

  const columnVisibility = shouldUseColumnVisibilityHook
    ? columnVisibilityHook.columnVisibility
    : fallbackColumnVisibility;

  const handleColumnVisibilityChange = (
    updater: ((old: VisibilityState) => VisibilityState) | VisibilityState
  ) => {
    const newValue =
      typeof updater === "function" ? updater(columnVisibility) : updater;

    if (shouldUseColumnVisibilityHook) {
      columnVisibilityHook.setColumnVisibility(newValue);
    } else {
      setFallbackColumnVisibility(newValue);
    }
  };

  const hasPagination = pagination !== undefined;

  const pageCount =
    hasPagination && pagination.total
      ? Math.ceil(pagination.total / pagination.state.pageSize)
      : -1;

  const table = useReactTable({
    data,
    columns,
    onSortingChange,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onRowSelectionChange: setRowSelection,
    manualSorting: true,
    state: {
      sorting: sorting || [],
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(hasPagination && {
        pagination: pagination.state,
      }),
    },
    ...(hasPagination && {
      pageCount,
      onPaginationChange: pagination.onPaginationChange,
      manualPagination: true,
    }),
  });

  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full">
      {shouldUseColumnVisibilityHook && (
        <div
          className={`flex items-center pb-4 ${
            columnVisibilityAlign === "end" ? "justify-end" : "justify-start"
          }`}
        >
          <ColumnVisibilityDropdown
            table={table}
            align={columnVisibilityAlign}
          />
        </div>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hasPagination && (
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <>
              <span className="text-sm text-muted-foreground">
                {t("table.pagination.itemsPerPage")}
              </span>
              <Select
                value={pagination.state.pageSize.toString()}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(pagination.pageSizeOptions || [5, 10, 20, 30, 50, 100]).map(
                    (size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {t("table.pagination.itemsSelected")}
              </span>
            </>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t("table.pagination.previous")}
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-muted-foreground">
                {t("table.pagination.pageInfo", {
                  currentPage: pagination.state.pageIndex + 1,
                  totalPages: pageCount > 0 ? pageCount : "?",
                })}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t("table.pagination.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
