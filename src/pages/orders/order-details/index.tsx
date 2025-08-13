import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Navbar } from "@/components/shared/Navbar";
import { Spinner } from "@/components/ui/spinner";
import { useGetOrderDetail } from "@/pages/orders/hooks/use-order";

import InfoCard from "./components/InfoCard";
import OrderItem from "./components/OrderItem";

const OrderDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams({ from: "/orders/$id" });
  const { data: order, isLoading } = useGetOrderDetail(id);

  if (isLoading && !order) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex size-full items-center justify-center">
        <p>{t("pages.order.orderDetails.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col gap-y-4">
      <Navbar />
      <div className="mx-auto flex w-4/5 flex-col gap-y-8 p-4">
        <InfoCard
          created_at={order.created_at}
          updated_at={order.updated_at}
          delivery_fee={order.delivery_fee}
          delivery_note={order.delivery_note}
          delivery_time={order.delivery_time}
          order_status={order.order_status}
          contact_info={order.contact_info}
        />
        <OrderItem data={order.order_detail} />
      </div>
    </div>
  );
};

export default OrderDetailsPage;
