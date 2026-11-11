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

import type { TUserRole } from "../../model/schema";

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
            onValueChange={(value) => setUserRole(value as TUserRole)}
            defaultValue={defaultRole}
          >
            <div className="flex items-center gap-x-2 rounded-sm border p-2">
              <RadioGroupItem id="new" value="new" />
              <Label htmlFor="new">{t("users.roles.new")}</Label>
            </div>

            <div className="flex items-center gap-x-2 rounded-sm border p-2">
              <RadioGroupItem id="user" value="user" />
              <Label htmlFor="user">{t("users.roles.user")}</Label>
            </div>

            <div className="flex items-center gap-x-2 rounded-sm border p-2">
              <RadioGroupItem id="vip" value="vip" />
              <Label htmlFor="vip">{t("users.roles.vip")}</Label>
            </div>

            <div className="flex items-center gap-x-2 rounded-sm border p-2">
              <RadioGroupItem id="agent" value="agent" />
              <Label htmlFor="agent">{t("users.roles.agent")}</Label>
            </div>

            <div className="flex items-center gap-x-2 rounded-sm border p-2">
              <RadioGroupItem id="cservice" value="cservice" />
              <Label htmlFor="cservice">{t("users.roles.cservice")}</Label>
            </div>

            <div className="flex items-center gap-x-2 rounded-sm border p-2">
              <RadioGroupItem id="admin" value="admin" />
              <Label htmlFor="admin">{t("users.roles.admin")}</Label>
            </div>

            <div className="flex items-center gap-x-2 rounded-sm border p-2">
              <RadioGroupItem id="superadmin" value="superadmin" />
              <Label htmlFor="superadmin">{t("users.roles.superadmin")}</Label>
            </div>
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
