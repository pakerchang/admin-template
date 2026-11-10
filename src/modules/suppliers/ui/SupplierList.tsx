import dayjs from "dayjs";
import { ArrowUpDown, Building2, Plus, Search } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { paginationSchema } from "@/shared/api/schema";
import { Button } from "@/shared/ui/button";
import {
  TABLE_VISIBILITY_STORAGE_KEYS,
  useApiSorting,
  convertToApiSorting,
} from "@/shared/ui/data-table";
import DataTable from "@/shared/ui/data-table/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import EditActions from "@/shared/ui/edit-actions";
import { Guarded } from "@/shared/ui/guarded";
import { Input } from "@/shared/ui/input";
import { Navbar } from "@/shared/ui/navbar/navbar";
import { Spinner } from "@/shared/ui/spinner";

import { useGetSupplierList, useDeleteSupplier } from "../model/use-supplier";

import SupplierFormDialog from "./components/SupplierFormDialog";

import type { TSupplier } from "../model/schema";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const SupplierList = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based
    pageSize: paginationSchema.parse({}).limit,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedSupplier, setSelectedSupplier] = useState<TSupplier | null>(
    null
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<TSupplier | null>(
    null
  );

  const { sorting, setSorting } = useApiSorting({
    defaultSort: [{ id: "created_at", desc: true }],
    onSortChange: useCallback(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []),
  });

  const apiSortingParams = convertToApiSorting(sorting);

  const { data: supplierResponse, isLoading } = useGetSupplierList({
    page: pagination.pageIndex + 1, // convert to 1-based
    limit: pagination.pageSize,
    ...(apiSortingParams.sort_by && { sort_by: apiSortingParams.sort_by }),
    ...(apiSortingParams.order && { order: apiSortingParams.order }),
  });

  const deleteSupplierMutation = useDeleteSupplier();

  const filteredData = useMemo(() => {
    if (!supplierResponse?.data) return [];
    if (!searchTerm.trim()) return supplierResponse.data;

    const lowercaseSearch = searchTerm.toLowerCase();
    return supplierResponse.data.filter((supplier) => {
      return (
        supplier.supplier_id.toLowerCase().includes(lowercaseSearch) ||
        supplier.supplier_name.toLowerCase().includes(lowercaseSearch)
      );
    });
  }, [supplierResponse?.data, searchTerm]);

  const handleCreateSupplier = () => {
    setFormMode("create");
    setSelectedSupplier(null);
    setFormOpen(true);
  };

  const handleEditSupplier = (supplier: TSupplier) => {
    setFormMode("edit");
    setSelectedSupplier(supplier);
    setFormOpen(true);
  };

  const handleDeleteSupplier = (supplier: TSupplier) => {
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      await deleteSupplierMutation.mutateAsync(supplierToDelete.supplier_id);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const columns: ColumnDef<TSupplier>[] = [
    {
      accessorKey: "supplier_id",
      enableHiding: false,
      meta: {
        displayName: t("suppliers.table.headers.supplierId"),
      },
      header: () => <h4>{t("suppliers.table.headers.supplierId")}</h4>,
      cell: ({ row }) => {
        const supplierId = row.getValue("supplier_id") as string;
        return (
          <div className="text-center">
            <p className="font-mono text-sm">{supplierId}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "supplier_name",
      enableSorting: true,
      enableHiding: true,
      meta: {
        displayName: t("suppliers.table.headers.supplierName"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("suppliers.table.headers.supplierName")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return (
          <p className="text-center font-medium">
            {row.getValue("supplier_name")}
          </p>
        );
      },
    },
    {
      id: "contact",
      enableHiding: true,
      meta: {
        displayName: t("suppliers.table.headers.contact"),
      },
      header: () => <h4>{t("suppliers.table.headers.contact")}</h4>,
      cell: ({ row }) => {
        const contact = row.original.contact_info;
        return (
          <div className="space-y-1 text-sm">
            <div>{contact.phone}</div>
            <div className="text-muted-foreground">{contact.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "contact_info.address",
      enableHiding: true,
      meta: {
        displayName: t("suppliers.table.headers.address"),
      },
      header: () => <h4>{t("suppliers.table.headers.address")}</h4>,
      cell: ({ row }) => {
        return (
          <div className="max-w-xs">
            <p className="text-sm">{row.original.contact_info.address}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "remark",
      enableHiding: true,
      meta: {
        displayName: t("suppliers.table.headers.remark"),
      },
      header: () => <h4>{t("suppliers.table.headers.remark")}</h4>,
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.original.remark || "-"}</div>
      ),
    },
    {
      accessorKey: "created_at",
      enableSorting: true,
      enableHiding: true,
      meta: {
        displayName: t("table.headers.createdAt"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.createdAt")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="text-center text-sm text-gray-600">
            {dayjs(date).format("YYYY-MM-DD HH:mm")}
          </div>
        );
      },
    },
    {
      accessorKey: "updated_at",
      enableSorting: true,
      enableHiding: true,
      meta: {
        displayName: t("table.headers.updatedAt"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("table.headers.updatedAt")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("updated_at") as string;
        return (
          <div className="text-center text-sm text-gray-600">
            {dayjs(date).format("YYYY-MM-DD HH:mm")}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      meta: {
        displayName: t("table.headers.actions"),
      },
      header: () => (
        <h4 className="text-center">{t("table.headers.actions")}</h4>
      ),
      cell: ({ row }) => {
        const supplier = row.original;
        return (
          <EditActions
            onEdit={{
              handler: () => handleEditSupplier(supplier),
              permission: "suppliers:update",
            }}
            onDelete={{
              handler: () => handleDeleteSupplier(supplier),
              permission: "suppliers:delete",
            }}
          />
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Spinner className="size-8" />
          <p className="text-gray-500">{t("suppliers.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <Navbar />
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="size-6" />
            <h2 className="text-2xl font-bold tracking-tight">
              {t("suppliers.nav.title")}
            </h2>
          </div>
          <Guarded permission="suppliers:create">
            <Button onClick={handleCreateSupplier}>
              <Plus className="mr-2 size-4" />
              {t("suppliers.addSupplier")}
            </Button>
          </Guarded>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="size-4 text-gray-400" />
          <Input
            placeholder={t("suppliers.search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          pagination={{
            state: pagination,
            onPaginationChange: setPagination,
            total: supplierResponse?.total ?? 0,
          }}
          enableColumnVisibility={true}
          columnVisibilityStorageKey={
            TABLE_VISIBILITY_STORAGE_KEYS.SUPPLIERS_TABLE
          }
          columnVisibilityAlign="start"
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={selectedSupplier}
        mode={formMode}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suppliers.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("suppliers.deleteDescription", {
                name: supplierToDelete?.supplier_name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSupplierMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteSupplierMutation.isPending}
            >
              {deleteSupplierMutation.isPending && (
                <Spinner className="mr-2 size-4" />
              )}
              {t("suppliers.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierList;
