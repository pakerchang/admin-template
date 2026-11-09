import { Button } from "@/components/ui/button";
import { useCan } from "@/shared/permission";

import type { TPermission } from "@/shared/permission";
import type { ComponentType } from "react";

/** §6.4：表格列操作，權限宣告在資料上，不在元件裡寫 `canX && <Button/>` */
export type TRowAction<T> = {
  id: string;
  label: string;
  icon?: ComponentType<{ size?: number }>;
  permission: TPermission;
  /** 無權限時：隱藏（預設）或 disabled */
  denied?: "hide" | "disable";
  onSelect: (row: T) => void;
};

export const RowActions = <T,>({
  row,
  actions,
}: {
  row: T;
  actions: readonly TRowAction<T>[];
}) => {
  const allowed = useCan();
  return (
    <div className="flex items-center justify-center gap-2">
      {actions.map(
        ({ id, label, icon: Icon, permission, denied = "hide", onSelect }) => {
          const ok = allowed(permission);
          if (!ok && denied === "hide") return null;
          return (
            <Button
              key={id}
              variant="outline"
              title={label}
              aria-label={label}
              disabled={!ok}
              onClick={() => onSelect(row)}
            >
              {Icon ? <Icon size={16} /> : label}
            </Button>
          );
        }
      )}
    </div>
  );
};
