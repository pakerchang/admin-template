import { useTranslation } from "react-i18next";

import { Tag } from "@/components/shared/Tags";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EOrderStatus } from "@/services/contracts/orders";

import { getOrderStatusText } from "../utils/order-status";

import type { TOrder } from "@/services/contracts/orders";
import type { Column } from "@tanstack/react-table";

interface StatusColumnFilterProps {
  column: Column<TOrder, unknown>;
}

const ALL_STATUS_VALUE = "all" as const;

const StatusColumnFilter = ({ column }: StatusColumnFilterProps) => {
  const { t } = useTranslation();

  const filterValue = column.getFilterValue() as EOrderStatus | undefined;

  const statusOptions = [
    { value: ALL_STATUS_VALUE, label: t("pages.order.filter.allStatus") },
    { value: EOrderStatus.NEW, label: t("status.new") },
    { value: EOrderStatus.PENDING, label: t("status.pending") },
    { value: EOrderStatus.PAID, label: t("status.paid") },
    { value: EOrderStatus.SHIPPED, label: t("status.shipped") },
    { value: EOrderStatus.REFUNDED, label: t("status.refunded") },
    { value: EOrderStatus.COMPLETED, label: t("status.completed") },
    { value: EOrderStatus.CANCELLED, label: t("status.cancelled") },
  ];

  const handleValueChange = (newValue: string) => {
    if (newValue === ALL_STATUS_VALUE) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(newValue as EOrderStatus);
    }
  };

  const getDisplayValue = () => {
    if (!filterValue) {
      return t("pages.order.filter.allStatus");
    }
    return getOrderStatusText(filterValue, t);
  };

  const currentValue = filterValue || ALL_STATUS_VALUE;

  return (
    <div className="flex flex-col items-center gap-2">
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-auto min-w-fit gap-2 border-none px-2 py-1 shadow-none hover:bg-muted/50 focus:ring-0 focus:ring-offset-0">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                {t("table.headers.order.status")}:
              </span>
              {filterValue ? (
                <Tag type={filterValue} tagContent={getDisplayValue()} />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t("pages.order.filter.allStatus")}
                </span>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.value === ALL_STATUS_VALUE ? (
                  <span className="text-xs">{option.label}</span>
                ) : (
                  <Tag
                    type={option.value as EOrderStatus}
                    tagContent={option.label}
                  />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusColumnFilter;
