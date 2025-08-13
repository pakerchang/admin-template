import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
  isEditing?: boolean;
}

const LinkDialog = ({
  isOpen,
  onClose,
  onSave,
  initialUrl = "",
  initialText = "",
  isEditing = false,
}: LinkDialogProps) => {
  const { t } = useTranslation();

  const linkSchema = z.object({
    url: z
      .string()
      .min(1, { message: t("validation.editor.link.invalid") })
      .url({ message: t("validation.editor.link.invalid") }),
    text: z.string().optional(),
  });

  type LinkFormData = z.infer<typeof linkSchema>;

  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      url: initialUrl,
      text: initialText,
    },
  });

  const onSubmit = (data: LinkFormData) => {
    onSave(data.url, data.text);
    onClose();
    form.reset();
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("validation.editor.link.edit")
              : t("validation.editor.toolbar.link")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">{t("validation.editor.link.url")}</Label>
            <Input
              id="url"
              placeholder={t("validation.editor.link.urlPlaceholder")}
              {...form.register("url")}
              className={form.formState.errors.url ? "border-destructive" : ""}
            />
            {form.formState.errors.url && (
              <p className="text-sm text-destructive">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">{t("validation.editor.link.text")}</Label>
            <Input
              id="text"
              placeholder={t("validation.editor.link.textPlaceholder")}
              {...form.register("text")}
            />
            <p className="text-sm text-muted-foreground">
              {t("validation.editor.link.helpText")}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {isEditing ? t("common.update") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkDialog;
