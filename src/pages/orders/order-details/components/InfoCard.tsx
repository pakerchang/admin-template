import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { numericFormatter } from "react-number-format";

import Paper from "@/components/shared/Paper";
import { Tag } from "@/components/shared/Tags";
import { getOrderStatusText } from "@/pages/orders/utils/order-status";

import type { TOrder } from "@/services/contracts/orders";

type IInfoCardProps = Pick<
  TOrder,
  | "created_at"
  | "updated_at"
  | "delivery_fee"
  | "delivery_note"
  | "delivery_time"
  | "order_status"
  | "contact_info"
>;

const InfoCard = (props: IInfoCardProps) => {
  const {
    created_at,
    updated_at,
    delivery_fee,
    delivery_note,
    delivery_time,
    order_status,
    contact_info,
  } = props;
  const { t } = useTranslation();

  return (
    <div className="flex h-fit w-full items-center gap-4">
      <Paper className="flex size-full flex-col gap-4 border border-gray-500">
        <h3 className="text-lg font-medium">
          {t("pages.order.orderDetails.orderStatus.title")}
        </h3>

        <div className="flex items-center justify-between gap-x-2">
          <Tag
            type={order_status}
            tagContent={getOrderStatusText(order_status, t)}
          />
        </div>

        <div className="flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-1">
            <p className="text-gray-400">
              {t("pages.order.orderDetails.orderStatus.lastUpdatedAt")}
            </p>
          </div>
          <p>{dayjs(updated_at).format("YYYY-MM-DD HH:mm")}</p>
        </div>

        <div className="flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-1">
            <p className="text-gray-400">
              {t("pages.order.orderDetails.orderStatus.orderCreateAt")}
            </p>
          </div>

          <p>{dayjs(created_at).format("YYYY-MM-DD HH:mm")}</p>
        </div>
      </Paper>

      <Paper className="flex size-full flex-col gap-y-4 border border-gray-500">
        <h3 className="text-lg font-medium">
          {t("pages.order.orderDetails.shipping.title")}
        </h3>

        <div className="flex flex-1 items-center justify-between">
          <p className="text-gray-400">
            {t("pages.order.orderDetails.shipping.shippingFee")}
          </p>
          <p className="text-end">
            {numericFormatter(String(delivery_fee), {
              thousandSeparator: ",",
              decimalSeparator: ".",
              decimalScale: 2,
            })}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-between">
          <p className="text-gray-400">
            {t("pages.order.orderDetails.shipping.shippingAddress")}
          </p>
          <p className="text-end">{contact_info.address}</p>
        </div>

        <div className="flex flex-1 items-center justify-between">
          <p className="text-gray-400">
            {t("pages.order.orderDetails.shipping.shippingTime")}
          </p>
          <p className="text-end">
            {dayjs(delivery_time).format("YYYY-MM-DD HH:mm") || "-"}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-between">
          <p className="text-gray-400">
            {t("pages.order.orderDetails.shipping.shippingRemark")}
          </p>
          <p className="text-end">{delivery_note || "-"}</p>
        </div>
      </Paper>

      <Paper className="flex size-full flex-col gap-y-4 border border-gray-500">
        <h3 className="text-lg font-medium">
          {t("pages.order.orderDetails.customer.title")}
        </h3>

        <div className="flex flex-1 items-center justify-between">
          <p className="text-gray-400">
            {t("pages.order.orderDetails.customer.email")}
          </p>
          <p className="text-end">{contact_info.email}</p>
        </div>

        <div className="flex flex-1 items-center justify-between">
          <p className="text-gray-400">
            {t("pages.order.orderDetails.customer.phone")}
          </p>
          <p className="text-end">{contact_info.phone}</p>
        </div>
      </Paper>
    </div>
  );
};

export default InfoCard;
