import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { numericFormatter } from "react-number-format";

import DataTable from "@/components/shared/DataTable";
import Paper from "@/components/shared/Paper";

import type { TOrder, TOrderItem } from "@/services/contracts/orders";
import type { ColumnDef } from "@tanstack/react-table";

interface IOrderItemProps {
  data: TOrder["order_detail"];
}

const OrderItem = (props: IOrderItemProps) => {
  const { data } = props;

  const totalAmount = useMemo(() => {
    return data.reduce((acc, item) => {
      return acc + Number(item.price) * Number(item.size);
    }, 0);
  }, [data]);
  const { t } = useTranslation();
  const columns: ColumnDef<TOrderItem>[] = [
    {
      accessorKey: "product_images",
      enableHiding: false,
      header: () => (
        <h4 className="text-lg font-bold">
          {t("pages.order.orderDetails.orderItem.image")}
        </h4>
      ),
      cell: ({ row }) => {
        const images =
          row.getValue<TOrderItem["product_images"]>("product_images");

        if (!images || images.length === 0) {
          return <p className="text-center text-gray-400">-</p>;
        }

        return (
          <div className="flex justify-center">
            <img
              src={images[0].file_url}
              alt={images[0].file_name}
              className="size-20 rounded-lg object-cover"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "product_id",
      enableHiding: false,
      header: () => (
        <h4 className="text-lg font-bold">
          {t("pages.order.orderDetails.orderItem.productId")}
        </h4>
      ),
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("product_id")}</p>;
      },
    },
    {
      accessorKey: "price",
      enableHiding: false,
      header: () => (
        <h4 className="text-lg font-bold">
          {t("pages.order.orderDetails.orderItem.price")}
        </h4>
      ),
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("price")}</p>;
      },
    },
    {
      accessorKey: "size",
      enableHiding: false,
      header: () => (
        <h4 className="text-lg font-bold">
          {t("pages.order.orderDetails.orderItem.size")}
        </h4>
      ),
      cell: ({ row }) => {
        return <p className="text-center">{row.getValue("size")}</p>;
      },
    },
    {
      accessorKey: "promotion_note",
      enableHiding: false,
      header: () => (
        <h4 className="text-lg font-bold">
          {t("pages.order.orderDetails.orderItem.discountRemark")}
        </h4>
      ),
      cell: ({ row }) => {
        const remark = row.getValue("promotion_note") as string;
        return <p className="text-center">{remark || "-"}</p>;
      },
    },
  ];

  return (
    <Paper className="flex h-fit w-full flex-col gap-y-4 p-0">
      <h3 className="text-lg font-medium">
        {t("pages.order.orderDetails.orderItem.title")}
      </h3>
      <DataTable columns={columns} data={data} />
      <div className="flex w-full items-center justify-end gap-x-3">
        <p className="text-lg font-medium text-gray-500">
          {t("pages.order.orderDetails.orderItem.totalAmount")}:
        </p>
        <p className="text-lg font-medium">
          {numericFormatter(String(totalAmount), {
            thousandSeparator: ",",
            decimalSeparator: ".",
            decimalScale: 2,
          })}
        </p>
      </div>
    </Paper>
  );
};

export default OrderItem;
