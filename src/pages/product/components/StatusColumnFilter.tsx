import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { activeStatusEnums, type EActiveStatus } from "@/services/types/schema";

import type { TProduct } from "@/services/contracts/product";
import type { Column } from "@tanstack/react-table";

type StatusCounts = {
  total: number;
} & Record<EActiveStatus, number>;

interface StatusColumnFilterProps {
  column: Column<TProduct, unknown>;
  statusCounts?: StatusCounts;
}

const ALL_STATUS_VALUE = "all" as const;

type FilterValue = EActiveStatus | typeof ALL_STATUS_VALUE;

const createStatusOptions = (t: (key: string) => string) => [
  {
    value: ALL_STATUS_VALUE,
    label: t("pages.product.filter.allStatus"),
  },
  ...activeStatusEnums.options.map((status) => ({
    value: status,
    label: t(`pages.product.status.${status}`),
  })),
];

const StatusColumnFilter = ({
  column,
  statusCounts,
}: StatusColumnFilterProps) => {
  const { t } = useTranslation();

  const rawFilterValue = column.getFilterValue();

  const parseResult = activeStatusEnums.safeParse(rawFilterValue);
  const filterValue: EActiveStatus | undefined = parseResult.success
    ? parseResult.data
    : undefined;

  const statusOptions = createStatusOptions(t);

  const handleValueChange = (newValue: FilterValue) => {
    if (newValue === ALL_STATUS_VALUE) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(newValue);
    }
  };

  const getDisplayValue = (): string => {
    if (!filterValue) {
      return t("pages.product.filter.allStatus");
    }
    return t(`pages.product.status.${filterValue}`);
  };

  const currentValue: FilterValue = filterValue ?? ALL_STATUS_VALUE;

  const getOptionCount = (optionValue: FilterValue): number | undefined => {
    if (optionValue === ALL_STATUS_VALUE) {
      return statusCounts?.total;
    }
    return statusCounts?.[optionValue];
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-auto min-w-fit gap-2 border-none px-2 py-1 shadow-none hover:bg-muted/50 focus:ring-0 focus:ring-offset-0">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                {t("table.headers.product.productStatus")}:
              </span>
              <span className="text-xs text-muted-foreground">
                {getDisplayValue()}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => {
            const count = getOptionCount(option.value);
            const content =
              count !== undefined
                ? `${option.label} (${count}/${statusCounts?.total})`
                : option.label;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span className="text-xs">{content}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusColumnFilter;
