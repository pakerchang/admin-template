import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { TextInput } from "@/shared/ui/text-inputs";

import {
  useCreateStaff,
  useUpdateStaff,
  useCreateStaffSchema,
  useUpdateStaffSchema,
} from "../../model/use-staff";

import type { TStaffUser, TCreateStaffUser } from "../../model/schema";
import type { TStaffCreateForm, TStaffUpdateForm } from "../../model/use-staff";

interface TeamMembersFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: TStaffUser | null;
  mode: "create" | "edit";
}

const TeamMembersFormDialog = ({
  open,
  onOpenChange,
  staff,
  mode,
}: TeamMembersFormDialogProps) => {
  const { t } = useTranslation();
  const createStaffSchema = useCreateStaffSchema();
  const updateStaffSchema = useUpdateStaffSchema();
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();

  const isEditing = mode === "edit" && staff;

  const createForm = useForm<TStaffCreateForm>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      account: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "",
    },
  });

  const updateForm = useForm<TStaffUpdateForm>({
    resolver: zodResolver(updateStaffSchema),
    defaultValues: {
      account: "",
      first_name: "",
      last_name: "",
      role: "",
    },
  });

  useEffect(() => {
    if (isEditing && staff) {
      updateForm.reset({
        account: staff.account,
        first_name: staff.first_name,
        last_name: staff.last_name,
        role: staff.role,
      });
    } else {
      createForm.reset({
        account: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "",
      });
    }
  }, [isEditing, staff, open, createForm, updateForm]);

  const onCreateSubmit = async (data: TStaffCreateForm) => {
    try {
      const createData: TCreateStaffUser = data;
      await createStaffMutation.mutateAsync(createData);
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const onUpdateSubmit = async (data: TStaffUpdateForm) => {
    try {
      if (staff) {
        const updateData: TStaffUser = {
          staff_id: staff.staff_id,
          account: data.account,
          email: staff.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          created_at: staff.created_at,
          updated_at: staff.updated_at,
        };
        await updateStaffMutation.mutateAsync(updateData);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const isLoading =
    createStaffMutation.isPending || updateStaffMutation.isPending;

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="mb-6">
            <DialogTitle>{t("team-members.editStaff")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={updateForm.handleSubmit(onUpdateSubmit)}
            className="space-y-6"
          >
            <TextInput
              label={t("team-members.account")}
              {...updateForm.register("account")}
              error={updateForm.formState.errors.account}
            />

            <TextInput
              label={t("team-members.firstName")}
              {...updateForm.register("first_name")}
              error={updateForm.formState.errors.first_name}
            />

            <TextInput
              label={t("team-members.lastName")}
              {...updateForm.register("last_name")}
              error={updateForm.formState.errors.last_name}
            />

            <div className="space-y-2">
              <Label>{t("team-members.role")}</Label>
              <Select
                value={updateForm.watch("role")}
                onValueChange={(value) => updateForm.setValue("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("team-members.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">
                    {t("team-members.roles.superadmin")}
                  </SelectItem>
                  <SelectItem value="admin">
                    {t("team-members.roles.admin")}
                  </SelectItem>
                  <SelectItem value="cservice">
                    {t("team-members.roles.cservice")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {updateForm.formState.errors.role && (
                <p className="text-sm text-destructive">
                  {updateForm.formState.errors.role.message}
                </p>
              )}
              <p className="text-sm text-gray-400">
                {t("team-members.editNotice")}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2 size-4" />}
                {t("common.update")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="mb-6">
          <DialogTitle>{t("team-members.createStaff")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={createForm.handleSubmit(onCreateSubmit)}
          className="space-y-6"
        >
          <TextInput
            label={t("team-members.account")}
            {...createForm.register("account")}
            error={createForm.formState.errors.account}
          />

          <TextInput
            label={t("team-members.email")}
            type="email"
            {...createForm.register("email")}
            error={createForm.formState.errors.email}
          />

          <TextInput
            label={t("team-members.password")}
            type="password"
            {...createForm.register("password")}
            error={createForm.formState.errors.password}
          />

          <TextInput
            label={t("team-members.firstName")}
            {...createForm.register("first_name")}
            error={createForm.formState.errors.first_name}
          />

          <TextInput
            label={t("team-members.lastName")}
            {...createForm.register("last_name")}
            error={createForm.formState.errors.last_name}
          />

          <div className="space-y-2">
            <Label>{t("team-members.role")}</Label>
            <Select
              value={createForm.watch("role")}
              onValueChange={(value) => createForm.setValue("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("team-members.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="superadmin">
                  {t("team-members.roles.superadmin")}
                </SelectItem>
                <SelectItem value="admin">
                  {t("team-members.roles.admin")}
                </SelectItem>
                <SelectItem value="cservice">
                  {t("team-members.roles.cservice")}
                </SelectItem>
              </SelectContent>
            </Select>
            {createForm.formState.errors.role && (
              <p className="text-sm text-destructive">
                {createForm.formState.errors.role.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 size-4" />}
              {t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamMembersFormDialog;
