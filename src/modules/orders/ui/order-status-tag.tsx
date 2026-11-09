import { EOrderStatus } from "@/services/schemas/orders";
import { Tag } from "@/shared/ui/tag";

import type { TTagTone } from "@/shared/ui/tag";

const STATUS_TONE: Partial<Record<string, TTagTone>> = {
  [EOrderStatus.NEW]: "warning",
  [EOrderStatus.PENDING]: "info",
  [EOrderStatus.SHIPPED]: "accent",
  [EOrderStatus.PAID]: "accent",
  [EOrderStatus.CANCELLED]: "danger",
  [EOrderStatus.REFUNDED]: "danger",
  [EOrderStatus.COMPLETED]: "success",
};

interface IOrderStatusTagProps {
  className?: string;
  type: EOrderStatus | string;
  tagContent: string;
}

/** 訂單狀態標籤（原 components/shared/Tags.tsx 的 EOrderStatus 配色，spec §5.1） */
export const OrderStatusTag = ({
  className,
  type,
  tagContent,
}: IOrderStatusTagProps) => (
  <Tag className={className} tone={STATUS_TONE[type]} tagContent={tagContent} />
);
