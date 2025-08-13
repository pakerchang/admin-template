import dayjs from "dayjs";
import { ArrowUpDown, Search, ShoppingBag } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import DataTable from "@/components/shared/DataTable";
import { Navbar } from "@/components/shared/Navbar";
import {
  TABLE_VISIBILITY_STORAGE_KEYS,
  useApiSorting,
  convertToApiSorting,
} from "@/components/shared/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { paginationSchema } from "@/services/types/schema";

import TransactionHistoryDialog from "./components/TransactionHistoryDialog";
import { useGetCustomerList } from "./hooks/use-consumer";

import type { TCustomer } from "@/services/contracts/customer";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const CustomerList = () => {
  const { t } = useTranslation();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based
    pageSize: paginationSchema.parse({}).limit,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const [purchaseHistoryOpen, setPurchaseHistoryOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");

  const { sorting, setSorting } = useApiSorting({
    defaultSort: [{ id: "total_spent", desc: true }],
    onSortChange: useCallback(() => {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []),
  });
  const consumerApiParams = useMemo(() => {
    const baseParams = convertToApiSorting(sorting);
    if (!baseParams.sort_by || !baseParams.order) return {};

    return {
      sort_by: baseParams.sort_by as "total_spent" | "order_count",
      order: baseParams.order,
    };
  }, [sorting]);

  const { data: customerResponse, isLoading } = useGetCustomerList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...consumerApiParams,
  });
  const filteredData = useMemo(() => {
    if (!customerResponse?.data) return [];
    if (!searchTerm.trim()) return customerResponse.data;

    const lowercaseSearch = searchTerm.toLowerCase();
    return customerResponse.data.filter((customer) => {
      const fullName =
        `${customer.first_name} ${customer.last_name}`.toLowerCase();
      return (
        customer.user_id.toLowerCase().includes(lowercaseSearch) ||
        customer.email.toLowerCase().includes(lowercaseSearch) ||
        fullName.includes(lowercaseSearch) ||
        customer.phone_number.includes(searchTerm)
      );
    });
  }, [customerResponse?.data, searchTerm]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewPurchaseHistory = (customer: TCustomer) => {
    setSelectedUserId(customer.user_id);
    setSelectedUserName(`${customer.first_name} ${customer.last_name}`);
    setPurchaseHistoryOpen(true);
  };

  const columns: ColumnDef<TCustomer>[] = [
    {
      accessorKey: "user_id",
      enableHiding: true,
      meta: {
        displayName: t("consumer.consumerId"),
      },
      header: () => <h4 className="text-center">{t("consumer.consumerId")}</h4>,
      cell: ({ row }) => {
        const userId = row.getValue<string>("user_id");
        const isLongId = userId.length > 15;

        return (
          <div className="text-center">
            {isLongId ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="whitespace-normal text-center font-mono text-sm">
                      {userId}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-center font-mono text-sm">{userId}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <p className="text-center font-mono text-sm">{userId}</p>
            )}
          </div>
        );
      },
    },
    {
      id: "name",
      enableHiding: true,
      meta: {
        displayName: t("consumer.name"),
      },
      header: () => <h4>{t("consumer.name")}</h4>,
      cell: ({ row }) => {
        const firstName = row.original.first_name;
        const lastName = row.original.last_name;
        const fullName = `${firstName || ""} ${lastName || ""}`.trim();
        return <p className="text-center">{fullName || "-"}</p>;
      },
    },
    {
      accessorKey: "email",
      enableHiding: true,
      meta: {
        displayName: t("consumer.email"),
      },
      header: () => <h4>{t("consumer.email")}</h4>,
      cell: ({ row }) => {
        const email = row.getValue<string>("email");
        return <p className="text-center text-sm">{email || "-"}</p>;
      },
    },
    {
      accessorKey: "phone_number",
      enableHiding: true,
      meta: {
        displayName: t("consumer.phoneNumber"),
      },
      header: () => <h4>{t("consumer.phoneNumber")}</h4>,
      cell: ({ row }) => {
        const phoneNumber = row.getValue<string>("phone_number");
        return <p className="text-center">{phoneNumber || "-"}</p>;
      },
    },
    {
      accessorKey: "total_spent",
      enableSorting: true,
      enableHiding: true,
      meta: {
        displayName: t("consumer.totalSpent"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("consumer.totalSpent")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.getValue<number>("total_spent");
        return (
          <div className="text-center font-medium text-green-600">
            {amount != null ? formatCurrency(amount) : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "order_count",
      enableSorting: true,
      enableHiding: true,
      meta: {
        displayName: t("consumer.orderCount"),
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("consumer.orderCount")}
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const orderCount = row.getValue<number>("order_count");
        return (
          <div className="text-center">
            {orderCount != null ? (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {orderCount} {t("consumer.orders")}
              </span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "last_order_date",
      enableSorting: false,
      enableHiding: true,
      meta: {
        displayName: t("consumer.lastOrderDate"),
      },
      header: () => <h4>{t("consumer.lastOrderDate")}</h4>,
      cell: ({ row }) => {
        const date = row.getValue<string | null>("last_order_date");
        return (
          <div className="text-center text-sm">
            {date
              ? dayjs(date).format("YYYY-MM-DD HH:mm")
              : t("consumer.noOrderRecord")}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      enableSorting: false,
      enableHiding: true,
      meta: {
        displayName: t("consumer.registrationDate"),
      },
      header: () => <h4>{t("consumer.registrationDate")}</h4>,
      cell: ({ row }) => {
        const createdAt = row.getValue<string>("created_at");
        return (
          <div className="text-center text-sm">
            {createdAt ? dayjs(createdAt).format("YYYY-MM-DD HH:mm") : "-"}
          </div>
        );
      },
    },
    {
      id: "purchase_history",
      enableHiding: true,
      enableSorting: false,
      meta: {
        displayName: t("consumer.purchaseHistory"),
      },
      header: () => (
        <h4 className="text-center">{t("consumer.purchaseHistory")}</h4>
      ),
      cell: ({ row }) => {
        const consumer = row.original;
        return (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewPurchaseHistory(consumer)}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="size-4" />
              {t("consumer.viewPurchaseHistory")}
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex size-full flex-col gap-4">
        <Navbar />
        <div className="flex size-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="large" />
            <p className="text-lg text-white">
              {t("consumer.loadingConsumerList")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col gap-4">
      <Navbar />
      <div className="p-4">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              {t("consumer.consumerList")}
            </h1>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t("consumer.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          pagination={{
            state: pagination,
            onPaginationChange: setPagination,
            total: customerResponse?.total ?? 0,
          }}
          enableColumnVisibility={true}
          columnVisibilityStorageKey={
            TABLE_VISIBILITY_STORAGE_KEYS.CUSTOMERS_TABLE
          }
          columnVisibilityAlign="start"
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </div>

      <TransactionHistoryDialog
        open={purchaseHistoryOpen}
        onOpenChange={setPurchaseHistoryOpen}
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </div>
  );
};

export default CustomerList;
