import { Pencil, Trash2, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCan } from "@/shared/permission";

import type { TPermission } from "@/shared/permission";
import type { PropsWithChildren } from "react";

/** §6.4：操作與所需權限一起宣告；無權限的操作不渲染 */
type TAction = { handler: () => void; permission: TPermission };

interface IEditActionsProps extends PropsWithChildren {
  className?: string;
  onEdit?: TAction;
  onView?: TAction;
  onDelete?: TAction;
}

const EditActions = ({
  className,
  onEdit,
  onView,
  onDelete,
  children,
}: IEditActionsProps) => {
  const { t } = useTranslation();
  const allowed = useCan();
  const show = (action?: TAction): action is TAction =>
    !!action && allowed(action.permission);

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {show(onEdit) && (
        <Button
          variant="outline"
          title={t("common.edit")}
          aria-label={t("common.edit")}
          onClick={onEdit.handler}
        >
          <Pencil size={16} />
        </Button>
      )}

      {show(onView) && (
        <Button
          variant="outline"
          title={t("common.view")}
          aria-label={t("common.view")}
          onClick={onView.handler}
        >
          <Eye size={16} />
        </Button>
      )}

      {children}

      {show(onDelete) && (
        <Button
          variant="outline"
          title={t("common.delete")}
          aria-label={t("common.delete")}
          onClick={onDelete.handler}
        >
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
};

export default EditActions;
