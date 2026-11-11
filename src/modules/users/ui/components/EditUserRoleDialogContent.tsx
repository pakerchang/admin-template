import { useState } from "react";
import { useTranslation } from "react-i18next";

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

import { userRoleEnum } from "../../model/schema";

import type { TUserRole } from "../../model/schema";
import type { TLeafKey } from "@/shared/i18n/types";

/** T3 OD-T3-4 A：角色清單取自 userRoleEnum，少任何一個角色 tsc 即報錯 */
const ROLE_LABELS: Record<TUserRole, TLeafKey> = {
  guest: "users.roles.guest",
  user: "users.roles.user",
  premium: "users.roles.premium",
  partner: "users.roles.partner",
  support: "users.roles.support",
  admin: "users.roles.admin",
  superadmin: "users.roles.superadmin",
};

interface EditUserRoleDialogContentProps {
  defaultRole: TUserRole;
  onSubmit?: (role: TUserRole) => void;
}

const EditUserRoleDialogContent = ({
  defaultRole,
  onSubmit,
}: EditUserRoleDialogContentProps) => {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<TUserRole>(defaultRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(userRole);
  };

  return (
    <DialogContent className="w-[400px] shadow-[0_0_10px_2px_rgba(168,85,247,0.8)] transition duration-300 hover:shadow-[0_0_20px_4px_rgba(192,132,252,1)]">
      <DialogHeader>
        <DialogTitle>{t("users.editRole.title")}</DialogTitle>
        <DialogDescription>{t("users.editRole.description")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-1 flex-col">
          <RadioGroup
            onValueChange={(value) => {
              const parsed = userRoleEnum.safeParse(value);
              if (parsed.success) setUserRole(parsed.data);
            }}
            defaultValue={defaultRole}
          >
            {userRoleEnum.options.map((role) => (
              <div
                key={role}
                className="flex items-center gap-x-2 rounded-sm border p-2"
              >
                <RadioGroupItem id={role} value={role} />
                <Label htmlFor={role}>{t(ROLE_LABELS[role])}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter className="mt-4">
          <Button type="submit">{t("common.submit")}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default EditUserRoleDialogContent;
