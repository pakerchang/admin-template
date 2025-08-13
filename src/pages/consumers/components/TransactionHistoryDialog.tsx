import { ShoppingBag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useGetTransactionHistory } from "../hooks/use-consumer";

import OrderCard from "./OrderCard";

interface TransactionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const TransactionHistoryDialog = ({
  open,
  onOpenChange,
  userId,
  userName,
}: TransactionHistoryDialogProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const limit = 5;

  const statusOptions = [
    {
      value: "all",
      label: t("consumer.orderStatus.all"),
    },
    {
      value: "pending",
      label: t("consumer.orderStatus.pending"),
    },
    {
      value: "completed",
      label: t("consumer.orderStatus.completed"),
    },
    {
      value: "cancelled",
      label: t("consumer.orderStatus.cancelled"),
    },
  ] as const;
  const { data: purchaseData, isLoading } = useGetTransactionHistory({
    user_id: userId,
    page: 1,
    limit: 1000,
  });

  const { filteredData, totalPages, totalCount } = useMemo(() => {
    if (!purchaseData?.data) {
      return { filteredData: [], totalPages: 0, totalCount: 0 };
    }

    const filtered =
      selectedStatus === "all"
        ? purchaseData.data
        : purchaseData.data.filter(
            (order) => order.order_status === selectedStatus
          );

    const total = Math.ceil(filtered.length / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      filteredData: paginatedData,
      totalPages: total,
      totalCount: filtered.length,
    };
  }, [purchaseData?.data, selectedStatus, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [selectedStatus]);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" />
            {t("consumer.purchaseHistoryTitle", { name: userName })}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={selectedStatus}
          onValueChange={setSelectedStatus}
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <TabsList className="grid w-fit grid-cols-4">
            {statusOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            value={selectedStatus}
            className="mt-0 min-h-0 flex-1 overflow-y-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <Spinner size="large" />
                  <p className="text-gray-200">
                    {t("consumer.loadingPurchaseHistory")}
                  </p>
                </div>
              </div>
            ) : !filteredData || filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="mx-auto size-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-200">
                  {selectedStatus !== "all"
                    ? t("consumer.noMatchingOrders")
                    : t("consumer.noPurchaseHistory")}
                </h3>
                <p className="mt-2 text-gray-400">
                  {selectedStatus !== "all"
                    ? t("consumer.noOrdersWithStatus", {
                        status: statusOptions.find(
                          (opt) => opt.value === selectedStatus
                        )?.label,
                      })
                    : t("consumer.noOrdersFound")}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredData.map((order) => (
                  <OrderCard key={order.order_id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {filteredData && filteredData.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              {t("consumer.pageInfo", {
                current: page,
                total: totalPages,
                count: totalCount,
              })}
              {selectedStatus !== "all" && (
                <span className="ml-2 text-xs text-gray-500">
                  -{" "}
                  {t("consumer.filterCondition", {
                    status: statusOptions.find(
                      (opt) => opt.value === selectedStatus
                    )?.label,
                  })}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page <= 1}
              >
                {t("table.pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages}
              >
                {t("table.pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionHistoryDialog;
