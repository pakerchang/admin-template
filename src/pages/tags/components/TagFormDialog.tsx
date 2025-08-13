import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TextInput } from "@/components/shared/TextInputs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

import {
  useCreateTagSchema,
  useCreateTag,
  useUpdateTag,
} from "../hooks/use-tag";

import type { TTagForm } from "../hooks/use-tag";
import type { TTag } from "@/services/contracts/tag";

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: TTag | null;
  mode: "create" | "edit";
}

const TagFormDialog = ({
  open,
  onOpenChange,
  tag,
  mode,
}: TagFormDialogProps) => {
  const { t } = useTranslation();
  const tagFormSchema = useCreateTagSchema();
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();

  const isEditing = mode === "edit" && tag;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TTagForm>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      tag_name: "",
    },
  });

  useEffect(() => {
    if (isEditing && tag) {
      reset({
        tag_name: tag.tag_name,
      });
    } else {
      reset({
        tag_name: "",
      });
    }
  }, [isEditing, tag, open, reset]);

  const onSubmit = async (data: TTagForm) => {
    try {
      if (isEditing && tag) {
        // 更新標籤
        await updateTagMutation.mutateAsync({
          tag_id: tag.tag_id,
          tag_name: data.tag_name,
        });
      } else {
        // 新增標籤
        await createTagMutation.mutateAsync({
          tag_name: data.tag_name,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const isLoading = createTagMutation.isPending || updateTagMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="mb-6">
          <DialogTitle>
            {isEditing ? t("pages.tag.editTag") : t("pages.tag.addTag")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TextInput
            label={t("pages.tag.tagName")}
            placeholder={t("pages.tag.tagNamePlaceholder")}
            {...register("tag_name")}
            error={errors.tag_name}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {(isSubmitting || isLoading) && (
                <Spinner className="mr-2 size-4" />
              )}
              {isEditing ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TagFormDialog;
