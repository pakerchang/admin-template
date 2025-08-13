import { Edit2, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    if (isDemoting || isUpdating) return t("pages.banner.actions.processing");
    if (isReordering) return t("pages.banner.actions.processing");
    return t("pages.banner.actions.demoteToInactive");
  }, [isDemoting, isUpdating, isReordering, t]);

  const promoteButtonText = useMemo(() => {
    if (isPromoting || isUpdating) return t("pages.banner.actions.processing");
    if (isReordering) return t("pages.banner.actions.processing");
    return t("pages.banner.actions.promoteToActive");
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
      )}

      {!isActive && onPromoteToActive && (
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
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/10 hover:bg-white/20"
            onClick={onEdit}
            disabled={hasActiveOperation}
          >
            <Edit2 className="size-4 text-white" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/10 hover:bg-white/20"
            onClick={onDelete}
            disabled={hasActiveOperation}
          >
            <Trash2 className="size-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};
