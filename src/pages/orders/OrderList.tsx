import { useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowUpDown, Copy, Search, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "react-use";

import DataTable from "@/components/shared/DataTable";
import EditActions from "@/components/shared/EditActions";
import { Navbar } from "@/components/shared/Navbar";
import {
  TABLE_VISIBILITY_STORAGE_KEYS,
  useApiSorting,
  convertToApiSorting,
} from "@/components/shared/table";
import { Tag } from "@/components/shared/Tags";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { EOrderStatus } from "@/services/contracts/orders";
import { paginationSchema } from "@/services/types/schema";

import EditDialogContent from "./components/EditDialogContent";
import StatusColumnFilter from "./components/StatusColumnFilter";
import {
  useGetOrderList,
  useGetOrder,
  useUpdateOrderStatus,
} from "./hooks/use-order";
import { copyOrderToClipboard } from "./utils/copy-order";
import { getOrderStatusText } from "./utils/order-status";

import type { TOrder } from "@/services/contracts/orders";
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
} from "@tanstack/react-table";

const OrderListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based
    pageSize: paginationSchema.parse({}).limit,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm.trim());
      if (searchTerm.trim()) {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }
    },
    500,
    [searchTerm]
  );

  const { sorting, setSorting } = useApiSorting({
    onSortChange: useCallback(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []),
  });

  const apiSortingParams = convertToApiSorting(sorting);

  const statusFilter = columnFilters.find(
    (filter) => filter.id === "order_status"
  )?.value as EOrderStatus | undefined;

  const { data: orderList, isLoading: isLoadingList } = useGetOrderList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...apiSortingParams,
    ...(statusFilter && { order_status: statusFilter }),
  });

  const { data: searchResult, isLoading: isSearching } = useGetOrder(
    debouncedSearchTerm || ""
  );

  const displayData = debouncedSearchTerm
    ? searchResult?.data || []
    : orderList?.data || [];

  const isLoading = debouncedSearchTerm ? isSearching : isLoadingList;
  const totalCount = debouncedSearchTerm
    ? searchResult?.total || 0
    : orderList?.total || 0;

  const { mutate: updateOrderStatus } = useUpdateOrderStatus();

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const targetOrderId = useRef<TOrder["order_id"]>("");
  const targetOrderStatus = useRef<TOrder["order_status"]>(EOrderStatus.NEW);

  const onOpenEditDialog = (
    id: TOrder["order_id"],
    status: TOrder["order_status"]
  ) => {
    setOpenEditDialog(true);
    targetOrderId.current = id;
    targetOrderStatus.current = status;
  };

  const handleSubmit =
    (productId: string) => (status: TOrder["order_status"]) => {
      updateOrderStatus({
        order_id: productId,
        order_status: status,
      });
      setOpenEditDialog(false);
    };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleColumnFiltersChange = useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((prev: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      if (typeof updater === "function") {
        setColumnFilters((prev) => {
          const newFilters = updater(prev);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          return newFilters;
        });
      } else {
        setColumnFilters(updater);
        setPagination((prev) => ({ ...prev, pageIndex: 0 })); // 篩選時重置到第1頁
      }
    },
    []
  );

  const handleCopy = async (order: TOrder) => {
    const success = await copyOrderToClipboard(order, t, getOrderStatusText);

    if (success) {
      toast({
        title: t("messages.copySuccess"),
        variant: "success",
      });
    } else {
      toast({
        title: t("messages.copyFailed"),
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<TOrder>[] = [
    {
      accessorKey: "order_id",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.order.orderId"),
      },
      header: () => <h4 className="">{t("table.headers.order.orderId")}</h4>,
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("order_id")}</p>;
      },
    },
    {
      accessorKey: "agent_id",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.order.agentId"),
      },
      header: () => <h4 className="">{t("table.headers.order.agentId")}</h4>,
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("agent_id")}</p>;
      },
    },
    {
      accessorKey: "remark",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.order.remark"),
      },
      header: () => <h4 className="">{t("table.headers.order.remark")}</h4>,
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("remark")}</p>;
      },
    },
    {
      accessorKey: "order_status",
      enableHiding: true,
      enableColumnFilter: true,
      meta: {
        displayName: t("table.headers.order.status"),
      },
      header: ({ column }) => <StatusColumnFilter column={column} />,
      cell: ({ row }) => {
        const orderStatus = row.getValue("order_status") as string;
        const displayText = getOrderStatusText(orderStatus, t);

        return (
          <div className="flex justify-center">
            <Tag type={orderStatus as EOrderStatus} tagContent={displayText} />
          </div>
        );
      },
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
        return (
          <div className="text-center">
            {dayjs(row.getValue("created_at")).format("YYYY-MM-DD HH:mm")}
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
        return (
          <div className="text-center">
            {dayjs(row.getValue("updated_at")).format("YYYY-MM-DD HH:mm")}
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      enableHiding: true,
      meta: {
        displayName: t("table.headers.order.actions"),
      },
      header: () => <h4 className="">{t("table.headers.order.actions")}</h4>,
      cell: ({ row }) => {
        const id = row.getValue<TOrder["order_id"]>("order_id");
        const status = row.getValue<TOrder["order_status"]>("order_status");
        const order = row.original;
        return (
          <EditActions
            onEdit={() => onOpenEditDialog(id, status)}
            onView={() => navigate({ to: "/orders/$id", params: { id } })}
          >
            <Button variant="outline" onClick={() => handleCopy(order)}>
              <Copy size={16} />
            </Button>
          </EditActions>
        );
      },
    },
  ];

  return (
    <div className="flex size-full flex-col gap-4">
      <Navbar />
      <div className="p-4">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {t("pages.order.title")}
            </h1>
          </div>

          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t("pages.order.search.placeholder")}
              value={searchTerm}
              onChange={handleSearchChange}
              className="px-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                onClick={clearSearch}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {isLoading && debouncedSearchTerm && (
            <div className="flex items-center text-sm text-gray-400">
              <Spinner className="mr-2 size-4" />
              {t("pages.order.search.searching")}
            </div>
          )}

          {debouncedSearchTerm && !isLoading && (
            <div className="text-sm text-gray-300">
              {t("pages.order.search.results", {
                searchTerm: debouncedSearchTerm,
                count: totalCount,
              })}
            </div>
          )}
        </div>

        {debouncedSearchTerm && displayData.length === 0 && !isLoading && (
          <div className="py-8 text-center">
            <Search className="mx-auto mb-4 size-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-white">
              {t("pages.order.search.noResults")}
            </h3>
            <p className="text-gray-400">
              {t("pages.order.search.noResultsHint")}
              <button
                onClick={clearSearch}
                className="text-blue-400 underline hover:text-blue-300"
              >
                {t("pages.order.search.clearSearch")}
              </button>
            </p>
          </div>
        )}

        {(!debouncedSearchTerm || displayData.length > 0) && (
          <DataTable
            columns={columns}
            data={displayData}
            pagination={{
              state: debouncedSearchTerm
                ? { pageIndex: 0, pageSize: pagination.pageSize }
                : pagination,
              onPaginationChange: debouncedSearchTerm
                ? () => {}
                : setPagination,
              total: totalCount,
            }}
            enableColumnVisibility={true}
            columnVisibilityStorageKey={
              TABLE_VISIBILITY_STORAGE_KEYS.ORDERS_TABLE
            }
            columnVisibilityAlign="start"
            sorting={sorting}
            onSortingChange={setSorting}
            columnFilters={columnFilters}
            onColumnFiltersChange={handleColumnFiltersChange}
          />
        )}
      </div>
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <EditDialogContent
          defaultStatus={targetOrderStatus.current}
          onSubmit={handleSubmit(targetOrderId.current)}
        />
      </Dialog>
    </div>
  );
};

export default OrderListPage;
