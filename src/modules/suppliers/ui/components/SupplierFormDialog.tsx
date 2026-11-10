import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useToast } from "@/shared/lib/use-toast";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Spinner } from "@/shared/ui/spinner";
import { TextInput } from "@/shared/ui/text-inputs";

import {
  useCreateSupplier,
  useCreateSupplierSchema,
  useUpdateSupplier,
} from "../../model/use-supplier";

import type { TSupplier } from "../../model/schema";
import type { TSupplierForm } from "../../model/use-supplier";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: TSupplier | null;
  mode: "create" | "edit";
}

const SupplierFormDialog = ({
  open,
  onOpenChange,
  supplier,
  mode,
}: SupplierFormDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const supplierFormSchema = useCreateSupplierSchema();
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  const isEditing = mode === "edit" && supplier;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TSupplierForm>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      supplier_name: "",
      contact_info: {
        phone: "",
        email: "",
        address: "",
      },
      remark: "",
    },
  });

  useEffect(() => {
    if (isEditing && supplier) {
      reset({
        supplier_name: supplier.supplier_name,
        contact_info: {
          phone: supplier.contact_info.phone,
          email: supplier.contact_info.email,
          address: supplier.contact_info.address,
        },
        remark: supplier.remark || "",
      });
    } else {
      reset({
        supplier_name: "",
        contact_info: {
          phone: "",
          email: "",
          address: "",
        },
        remark: "",
      });
    }
  }, [isEditing, supplier, open, reset]);

  const onSubmit = async (data: TSupplierForm) => {
    try {
      if (isEditing && supplier) {
        await updateSupplierMutation.mutateAsync({
          supplier_id: supplier.supplier_id,
          supplier_name: data.supplier_name,
          contact_info: data.contact_info,
          remark: data.remark,
        });
      } else {
        await createSupplierMutation.mutateAsync({
          supplier_name: data.supplier_name,
          contact_info: {
            phone: data.contact_info.phone,
            email: data.contact_info.email,
            address: data.contact_info.address,
          },
          remark: data.remark,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: t("common.error"),
        description: isEditing
          ? t("suppliers.messages.updateFailed")
          : t("suppliers.messages.createFailed"),
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="mb-6">
          <DialogTitle>
            {isEditing
              ? t("suppliers.editSupplier")
              : t("suppliers.addSupplier")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TextInput
            label={t("suppliers.supplierName")}
            {...register("supplier_name")}
            error={errors.supplier_name}
          />

          <TextInput
            label={t("suppliers.phone")}
            {...register("contact_info.phone")}
            error={errors.contact_info?.phone}
          />

          <TextInput
            label={t("suppliers.email")}
            type="email"
            {...register("contact_info.email")}
            error={errors.contact_info?.email}
          />

          <TextInput
            label={t("suppliers.address")}
            {...register("contact_info.address")}
            error={errors.contact_info?.address}
          />

          <TextInput
            label={t("suppliers.remark")}
            {...register("remark")}
            error={errors.remark}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 size-4" />}
              {isEditing ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierFormDialog;
