import type { TFunction } from "i18next";

/**
 * 交易紀錄的訂單狀態文字（spec §5.2：consumers 自有格式化，不依賴 orders module；對照與 orders 的 getOrderStatusText 相同）
 * 未知或空狀態 → `status.new`
 */
export const getOrderStatusText = (
  status: string | null | undefined,
  t: TFunction
): string => {
  switch (status) {
    case "paid":
      return t("status.paid");
    case "shipped":
      return t("status.shipped");
    case "refunded":
      return t("status.refunded");
    case "completed":
      return t("status.completed");
    case "cancelled":
      return t("status.cancelled");
    case "pending":
      return t("status.pending");
    default:
      return t("status.new");
  }
};
