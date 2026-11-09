import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EOrderStatus } from "@/services/schemas/orders";
import { Button } from "@/shared/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import type { TOrder } from "@/services/schemas/orders";

interface EditDialogContentProps {
  defaultStatus: TOrder["order_status"];
  onSubmit?: (status: TOrder["order_status"]) => void;
}

const EditDialogContent = ({
  defaultStatus,
  onSubmit,
}: EditDialogContentProps) => {
  const { t } = useTranslation();
  const [orderStatus, setOrderStatus] =
    useState<TOrder["order_status"]>(defaultStatus);

  const orderStatusOptions = [
    { value: EOrderStatus.NEW, label: "status.new" },
    { value: EOrderStatus.SHIPPED, label: "status.shipped" },
    { value: EOrderStatus.PAID, label: "status.paid" },
    { value: EOrderStatus.REFUNDED, label: "status.refunded" },
    { value: EOrderStatus.COMPLETED, label: "status.completed" },
    { value: EOrderStatus.CANCELLED, label: "status.cancelled" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(orderStatus);
  };

  return (
    <DialogContent className="w-[400px] shadow-[0_0_10px_2px_rgba(168,85,247,0.8)] transition duration-300 hover:shadow-[0_0_20px_4px_rgba(192,132,252,1)]">
      <DialogHeader>
        <DialogTitle>{t("dialog.order.title")}</DialogTitle>
        <DialogDescription>{t("dialog.order.description")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-1 flex-col">
          <RadioGroup
            value={orderStatus}
            onValueChange={(value) =>
              setOrderStatus(value as TOrder["order_status"])
            }
            className="space-y-2"
          >
            {orderStatusOptions.map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className="flex cursor-pointer items-center gap-x-2 rounded-sm border p-2 hover:bg-accent"
              >
                <RadioGroupItem id={option.value} value={option.value} />
                <span className="flex-1">{t(option.label)}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter className="mt-4">
          <Button type="submit">{t("dialog.order.status.submit")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default EditDialogContent;
