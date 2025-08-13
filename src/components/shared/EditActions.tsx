import { Pencil, Trash2, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { PropsWithChildren } from "react";

interface IEditActionsProps extends PropsWithChildren {
  className?: string;
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
}

const EditActions = ({
  className,
  onEdit,
  onView,
  onDelete,
  children,
}: IEditActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {onEdit && (
        <Button
          variant="outline"
          title={t("common.edit")}
          aria-label={t("common.edit")}
          onClick={onEdit}
        >
          <Pencil size={16} />
        </Button>
      )}

      {onView && (
        <Button
          variant="outline"
          title={t("common.view")}
          aria-label={t("common.view")}
          onClick={onView}
        >
          <Eye size={16} />
        </Button>
      )}

      {children}

      {onDelete && (
        <Button
          variant="outline"
          title={t("common.delete")}
          aria-label={t("common.delete")}
          onClick={onDelete}
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
};

export default EditActions;
