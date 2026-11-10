import { Edit2, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Guarded } from "@/shared/ui/guarded";

interface IImageCardProps {
  className?: string;
  src: string;
  alt: string;
  onEdit?: () => void;
  onDelete?: () => void;
  id?: string;
  sortOrder?: number;
  isActive?: boolean;
  isPromoting?: boolean;
  isDemoting?: boolean;
  isUpdating?: boolean;
  isReordering?: boolean;
  onPromoteToActive?: () => void;
  onDemoteToInactive?: () => void;
}

export const ImageCard = ({
  src,
  alt,
  className,
  sortOrder,
  isActive = false,
  isPromoting = false,
  isDemoting = false,
  isUpdating = false,
  isReordering = false,
  onPromoteToActive,
  onDemoteToInactive,
  onEdit,
  onDelete,
}: IImageCardProps) => {
  const { t } = useTranslation();

  const hasActiveOperation = useMemo(
    () => isUpdating || isReordering,
    [isUpdating, isReordering]
  );

  const demoteButtonText = useMemo(() => {
    if (isDemoting || isUpdating) return t("banners.actions.processing");
    if (isReordering) return t("banners.actions.processing");
    return t("banners.actions.demoteToInactive");
  }, [isDemoting, isUpdating, isReordering, t]);

  const promoteButtonText = useMemo(() => {
    if (isPromoting || isUpdating) return t("banners.actions.processing");
    if (isReordering) return t("banners.actions.processing");
    return t("banners.actions.promoteToActive");
  }, [isPromoting, isUpdating, isReordering, t]);

  const isButtonDisabled = useMemo(
    () => isPromoting || isDemoting || hasActiveOperation,
    [isPromoting, isDemoting, hasActiveOperation]
  );

  return (
    <div
      className={cn("group relative block w-full overflow-hidden", className)}
    >
      {isActive && sortOrder && (
        <div className="absolute left-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-md">
          {sortOrder}
        </div>
      )}

      {isActive && onDemoteToInactive && (
        <Guarded permission="banners:update">
          <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={onDemoteToInactive}
              disabled={isButtonDisabled}
            >
              <TrendingDown className="mr-1 size-3" />
              {demoteButtonText}
            </Button>
          </div>
        </Guarded>
      )}

      {!isActive && onPromoteToActive && (
        <Guarded permission="banners:update">
          <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={onPromoteToActive}
              disabled={isButtonDisabled}
            >
              <TrendingUp className="mr-1 size-3" />
              {promoteButtonText}
            </Button>
          </div>
        </Guarded>
      )}

      <img
        loading="lazy"
        className={cn(
          "h-[300px] w-full rounded-lg object-cover object-center transition-transform duration-300",
          hasActiveOperation ? "opacity-75" : "group-hover:scale-105"
        )}
        src={src}
        alt={alt}
      />

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300",
          !hasActiveOperation && "group-hover:opacity-100"
        )}
      >
        <div className="flex items-center gap-2">
          <Guarded permission="banners:update">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 hover:bg-white/20"
              title={t("common.edit")}
              aria-label={t("common.edit")}
              onClick={onEdit}
              disabled={hasActiveOperation}
            >
              <Edit2 className="size-4 text-white" />
            </Button>
          </Guarded>
          <Guarded permission="banners:delete">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 hover:bg-white/20"
              title={t("common.delete")}
              aria-label={t("common.delete")}
              onClick={onDelete}
              disabled={hasActiveOperation}
            >
              <Trash2 className="size-4 text-white" />
            </Button>
          </Guarded>
        </div>
      </div>
    </div>
  );
};
