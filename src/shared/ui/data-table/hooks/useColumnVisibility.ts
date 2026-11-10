import { useCallback } from "react";
import { useLocalStorage } from "react-use";

import { getDefaultVisibility } from "../utils/table-visibility";

import type {
  UseColumnVisibilityOptions,
  UseColumnVisibilityReturn,
  TableVisibilityStorage,
} from "../table-visibility";
import type { VisibilityState } from "@tanstack/react-table";

export function useColumnVisibility<TData = unknown>(
  options: UseColumnVisibilityOptions<TData>
): UseColumnVisibilityReturn {
  const { columns, storageKey, defaultVisibility } = options;

  // 計算預設可見性狀態
  const computedDefaultVisibility =
    defaultVisibility ?? getDefaultVisibility(columns);

  // 使用 react-use 的 useLocalStorage 管理狀態
  const [storedData, setStoredData, removeStoredData] =
    useLocalStorage<TableVisibilityStorage>(storageKey, {
      hasCustomSettings: false,
      visibility: computedDefaultVisibility,
    });

  // 計算當前的 columnVisibility 狀態
  const columnVisibility: VisibilityState =
    storedData?.hasCustomSettings && storedData.visibility
      ? { ...computedDefaultVisibility, ...storedData.visibility }
      : computedDefaultVisibility;

  // 設定欄位可見性
  const setColumnVisibility = useCallback(
    (visibility: VisibilityState) => {
      setStoredData({
        hasCustomSettings: true,
        visibility,
      });
    },
    [setStoredData]
  );

  // 重置為預設設定
  const resetToDefault = useCallback(() => {
    removeStoredData();
  }, [removeStoredData]);

  return {
    columnVisibility,
    setColumnVisibility,
    resetToDefault,
    hasCustomSettings: storedData?.hasCustomSettings ?? false,
  };
}
