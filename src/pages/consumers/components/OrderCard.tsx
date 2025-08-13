import dayjs from "dayjs";
import { ShoppingBag, Package, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { getOrderStatusText } from "@/pages/orders/utils/order-status";

import type { TTransactionHistoryOrder } from "@/services/contracts/customer";

interface OrderCardProps {
  order: TTransactionHistoryOrder;
}

const OrderCard = ({ order }: OrderCardProps) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-5 text-blue-600" />
          <span className="font-medium text-white">
            {t("order.orderNumber")}: {order.order_id}
          </span>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-white">
            <Calendar className="size-4" />
            {dayjs(order.created_at).format("YYYY-MM-DD HH:mm")}
          </div>
          <div className="flex items-center justify-between gap-2 font-semibold text-white">
            {t("order.totalAmount")}:
            <span className="font-bold  text-[#fdba74]">
              {formatCurrency(Number(order?.total_order_fee))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-white">{t("order.status")}:</span>
          <span
            className={cn("rounded-full px-2 py-1 text-xs font-medium", {
              "bg-green-100 text-green-800": order.order_status === "completed",
              "bg-yellow-100 text-yellow-800": order.order_status === "pending",
              "bg-red-100 text-red-800": order.order_status === "cancelled",
              "bg-gray-100 text-gray-800": ![
                "completed",
                "pending",
                "cancelled",
              ].includes(order.order_status),
            })}
          >
            {getOrderStatusText(order.order_status, t)}
          </span>
        </div>
        {order.vendor_id && (
          <div className="text-white">
            {t("order.agent")}: {order?.vendor_id}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {order.order_detail?.map((item, index: number) => (
          <div
            key={`${item.product_id}-${index}`}
            className="flex items-start gap-4 rounded-lg border p-4 hover:bg-slate-700"
          >
            <div className="shrink-0">
              {item.product_images && item.product_images.length > 0 ? (
                <img
                  src={item.product_images[0].file_url}
                  alt={t("order.productName")}
                  className="size-16 object-cover"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-md bg-gray-200">
                  <Package className="size-6 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-white">{item.product_name}</h4>
                <span className="font-semibold text-[#fdba74]">
                  {formatCurrency(Number(item.price) * Number(item.size))}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-white">
                <span className="flex items-center gap-1">
                  <Package className="size-3" />
                  {t("order.quantity")}: {item.size}
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {t("order.productId")}: {item.product_id}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {order.contact_info && (
        <div className="rounded-lg border p-3 hover:bg-gray-700">
          <h5 className="mb-2 font-medium text-white">
            {t("order.contactInfoTitle")}
          </h5>
          <div className="space-y-1 text-sm text-white">
            <div>
              {t("order.email")}: {order.contact_info.email}
            </div>
            <div>
              {t("order.phone")}: {order.contact_info.phone}
            </div>
            <div>
              {t("order.address")}: {order.contact_info.address}
            </div>
          </div>
        </div>
      )}

      {order.remark && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{t("order.remark")}:</span>{" "}
          {order.remark}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
