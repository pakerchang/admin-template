import { EOrderStatus } from "@/services/contracts/orders";

import type { TFunction } from "i18next";

/**
 * 獲取訂單狀態的翻譯文字
 * @param status 訂單狀態
 * @param t 翻譯函數
 * @returns 翻譯後的狀態文字
 */
export const getOrderStatusText = (
  status: string | null | undefined,
  t: TFunction
): string => {
  const statusToDisplay = status || EOrderStatus.NEW;

  switch (statusToDisplay) {
    case EOrderStatus.PAID:
      return t("status.paid");
    case EOrderStatus.SHIPPED:
      return t("status.shipped");
    case EOrderStatus.REFUNDED:
      return t("status.refunded");
    case EOrderStatus.COMPLETED:
      return t("status.completed");
    case EOrderStatus.CANCELLED:
      return t("status.cancelled");
    case EOrderStatus.PENDING:
      return t("status.pending");
    case EOrderStatus.NEW:
    default:
      return t("status.new");
  }
};
