import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { EOrderStatus } from "@/services/contracts/orders";

import type { PropsWithChildren } from "react";

interface ITagsProps extends PropsWithChildren {
  className?: string;
  type: EOrderStatus | string;
  tagContent: string;
}

export const Tag = ({ className, tagContent, type }: ITagsProps) => {
  const colors = useMemo(() => {
    switch (type) {
      case EOrderStatus.NEW:
        return "border-orange-500 bg-orange-300 text-orange-900";
      case EOrderStatus.PENDING:
        return "border-blue-500 bg-blue-300 text-blue-900";
      case EOrderStatus.SHIPPED:
      case EOrderStatus.PAID:
        return "border-purple-500 bg-purple-300 text-purple-900";
      case EOrderStatus.CANCELLED:
      case EOrderStatus.REFUNDED:
        return "border-red-500 bg-red-300 text-red-900";
      case EOrderStatus.COMPLETED:
        return "border-green-500 bg-green-300 text-green-900";
      default:
        return "";
    }
  }, [type]);
  return (
    <div
      className={cn(
        "size-fit rounded-md border px-2 py-1 text-sm",
        colors,
        className
      )}
    >
      {tagContent}
    </div>
  );
};

interface IDotTagProps extends PropsWithChildren {
  className?: string;
  type: EOrderStatus;
}
export const DotTag = ({ className, type }: IDotTagProps) => {
  const color = useMemo(() => {
    switch (type) {
      case EOrderStatus.NEW:
        return "bg-orange-500";
      case EOrderStatus.PENDING:
        return "bg-blue-500";
      case EOrderStatus.SHIPPED:
      case EOrderStatus.PAID:
        return "bg-purple-500";
      case EOrderStatus.CANCELLED:
        return "bg-error";
      case EOrderStatus.COMPLETED:
        return "bg-success";
      default:
        return "";
    }
  }, [type]);

  return <div className={cn("size-2 rounded-full", color, className)} />;
};
