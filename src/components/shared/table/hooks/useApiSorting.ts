import { useCallback, useState } from "react";

import type { TSortOrder } from "@/services/types/schema";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";

/**
 * API 排序參數介面 (與後端 API 溝通用)
 */
export interface ApiSortingParams {
  sort_by?: string;
  order?: TSortOrder;
}

/**
 * useApiSorting Hook 選項
 */
interface UseApiSortingOptions {
  defaultSort?: SortingState;
  onSortChange?: (apiParams: ApiSortingParams) => void;
}

/**
 * useApiSorting Hook 回傳值
 */
interface UseApiSortingReturn {
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
  clearSorting: () => void;
}

/**
 * 將 TanStack Table SortingState 轉換為 API 參數
 */
export const convertToApiSorting = (
  sorting: SortingState
): ApiSortingParams => {
  if (!sorting.length) return {};

  const firstSort = sorting[0];
  return {
    sort_by: firstSort.id,
    order: firstSort.desc ? "DESC" : "ASC",
  };
};

/**
 * 將 API 參數轉換為 TanStack Table SortingState
 */
export const convertFromApiSorting = (
  apiParams: ApiSortingParams
): SortingState => {
  if (!apiParams.sort_by) return [];

  return [
    {
      id: apiParams.sort_by,
      desc: apiParams.order === "DESC",
    },
  ];
};

/**
 * API 排序 Hook
 *
 * 使用 TanStack Table 原生的 SortingState，與 API 排序完美整合
 *
 * @param options 配置選項
 * @returns TanStack Table 標準的排序狀態和控制函數
 *
 * @example
 * ```typescript
 * const { sorting, setSorting } = useApiSorting({
 *   onSortChange: (apiParams) => {
 *     setPage(1) // 排序時重置到第1頁
 *     // TanStack Query 會自動重新請求
 *   }
 * })
 *
 * // 在 DataTable 中使用
 * <DataTable
 *   sorting={sorting}
 *   onSortingChange={setSorting}
 *   // ...
 * />
 *
 * // 在 API 請求中使用
 * const apiParams = convertToApiSorting(sorting)
 * const { data } = useQuery({
 *   queryKey: ['orders', page, limit, apiParams],
 *   queryFn: () => api.getOrders({ page, limit, ...apiParams })
 * })
 * ```
 */
export const useApiSorting = (
  options: UseApiSortingOptions = {}
): UseApiSortingReturn => {
  const { defaultSort = [], onSortChange } = options;

  const [sorting, setSortingState] = useState<SortingState>(defaultSort);

  /**
   * 設置排序狀態，並觸發 API 請求
   */
  const setSorting = useCallback<OnChangeFn<SortingState>>(
    (updaterOrValue) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;

      setSortingState(newSorting);

      // 轉換為 API 參數並觸發請求
      const apiParams = convertToApiSorting(newSorting);
      onSortChange?.(apiParams);
    },
    [sorting, onSortChange]
  );

  /**
   * 清除所有排序
   */
  const clearSorting = useCallback(() => {
    setSortingState([]);
    onSortChange?.({});
  }, [onSortChange]);

  return {
    sorting,
    setSorting,
    clearSorting,
  };
};
