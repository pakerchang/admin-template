import dayjs from "dayjs";
import * as R from "ramda";

import type { TOrder, TOrderItem } from "@/services/contracts/orders";
import type { TFunction } from "i18next";

/**
 * 建立訂單基本資訊文字陣列
 */
const createBasicOrderInfo = (
  order: TOrder,
  t: TFunction,
  getOrderStatusText: (status: string, t: TFunction) => string
): (string | null)[] => [
  `${t("order.orderNumber")}: ${order.order_id}`,
  `${t("order.remark")}: ${order.remark}`,
  `${t("order.status")}: ${getOrderStatusText(order.order_status, t)}`,
  `${t("order.totalAmount")}: ${order.total_order_fee}`,
  order.created_at
    ? `${t("order.createdAt")}: ${dayjs(order.created_at).format(
        "YYYY-MM-DD HH:mm"
      )}`
    : null,
  order.updated_at
    ? `${t("order.updatedAt")}: ${dayjs(order.updated_at).format(
        "YYYY-MM-DD HH:mm"
      )}`
    : null,
];

/**
 * 建立單一商品明細文字陣列
 */
const createOrderItemInfo = (
  item: TOrderItem,
  index: number,
  t: TFunction
): (string | null)[] => [
  `${t("order.item")} ${index + 1}:`,
  `  ${t("order.productName")}: ${item.product_name}`,
  `  ${t("order.productId")}: ${item.product_id}`,
  `  ${t("order.quantity")}: ${item.size}`,
  `  ${t("order.price")}: ${item.price}`,
  item.promotion_note
    ? `  ${t("order.discountRemark")}: ${item.promotion_note}`
    : null,
];

/**
 * 建立訂單明細文字陣列
 */
const createOrderDetailsInfo = (
  order: TOrder,
  t: TFunction
): (string | null)[] => {
  const orderItemsText = order.order_detail
    .map((item: TOrderItem, index: number) =>
      createOrderItemInfo(item, index, t)
    )
    .flat();

  return [`${t("order.orderDetails")}:`, ...orderItemsText];
};

/**
 * 建立聯絡資訊文字陣列
 */
const createContactInfo = (order: TOrder, t: TFunction): (string | null)[] =>
  order.contact_info
    ? [
        `${t("order.contactInfo")}:`,
        `  Email: ${order.contact_info.email}`,
        `  ${t("order.phone")}: ${order.contact_info.phone}`,
        `  ${t("order.address")}: ${order.contact_info.address}`,
      ]
    : [];

/**
 * 建構完整的複製內容
 */
const buildCopyContent = R.pipe(R.flatten, R.filter(Boolean), R.join("\n"));

/**
 * 複製訂單資訊到剪貼簿
 * @param order 訂單資料
 * @param t i18n 翻譯函數
 * @param getOrderStatusText 取得訂單狀態文字的函數
 * @returns Promise<boolean> 複製是否成功
 */
export const copyOrderToClipboard = async (
  order: TOrder,
  t: TFunction,
  getOrderStatusText: (status: string, t: TFunction) => string
): Promise<boolean> => {
  try {
    const copyContent = buildCopyContent([
      createBasicOrderInfo(order, t, getOrderStatusText),
      [""], // 空行分隔
      createOrderDetailsInfo(order, t),
      [""], // 空行分隔
      createContactInfo(order, t),
    ]);

    // 使用 Clipboard API 複製
    await navigator.clipboard.writeText(copyContent);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};

/**
 * 使用 react-use 的 hook 版本
 * 這個函數返回一個可以在 React 組件中使用的 hook
 */
export const useCopyOrder = () => {
  return {
    copyOrder: copyOrderToClipboard,
  };
};

/**
 * 使用 Ramda curry 的純函數式版本
 * 建構複製內容，但不執行複製操作
 */
export const buildOrderCopyContent = R.curry(
  (
    getOrderStatusText: (status: string, t: TFunction) => string,
    t: TFunction,
    order: TOrder
  ): string =>
    buildCopyContent([
      createBasicOrderInfo(order, t, getOrderStatusText),
      [""],
      createOrderDetailsInfo(order, t),
      [""],
      createContactInfo(order, t),
    ])
);

/**
 * 使用 Ramda 管道的高階函數版本
 * 可以組合多個轉換操作
 */
export const processOrderForCopy = R.pipe(
  // 先建構內容
  (data: {
    order: TOrder;
    t: TFunction;
    getOrderStatusText: (status: string, t: TFunction) => string;
  }) => buildOrderCopyContent(data.getOrderStatusText, data.t, data.order),
  // 可以在這裡添加更多處理步驟，例如格式化、清理等
  R.trim
);
