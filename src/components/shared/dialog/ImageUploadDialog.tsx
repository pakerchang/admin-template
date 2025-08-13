import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { TextInput } from "@/components/shared/TextInputs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { IValidationManager } from "@/plugins/image-validation";

interface IImageUploadProps {
  onUpload: (fileName: string, base64: string) => void;
  error?: boolean;
  validationManager?: IValidationManager;
}

const ImageUpload = ({
  onUpload,
  error,
  validationManager,
}: IImageUploadProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [_selectedFile, setSelectedFile] = useState<File | null>(null);

  const allowedFormats = validationManager?.getAllowedFormats() || {
    types: ["image/jpeg", "image/png", "image/webp"],
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
  };

  const createImageUploadSchema = (t: (key: string) => string) =>
    z.object({
      fileName: z
        .string()
        .min(1, { message: t("validation.image.fileName.required") }),
      fileValue: z
        .string()
        .min(1, { message: t("validation.image.content.required") }),
      originalExtension: z.string(),
    });

  type TImageUpload = z.infer<ReturnType<typeof createImageUploadSchema>>;

  const schema = createImageUploadSchema(t);

  const form = useForm<TImageUpload>({
    resolver: zodResolver(schema),
    defaultValues: {
      fileName: "",
      fileValue: "",
      originalExtension: "",
    },
    mode: "onSubmit",
  });

  const resetState = () => {
    form.reset();
    setPreview("");
    setSelectedFile(null);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetState();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    form.clearErrors("fileValue");
    setSelectedFile(selectedFile);

    if (validationManager) {
      // 異步驗證
      (async () => {
        try {
          const validationResult = await validationManager.validateImage(
            selectedFile,
            {
              t: (key: string, options?: Record<string, unknown>) =>
                t(key, options),
            }
          );

          if (validationResult.errors.length > 0) {
            const errorMessages = validationResult.errors
              .map((error) => error.message)
              .filter((msg): msg is string => !!msg);

            if (errorMessages.length > 0) {
              const newErrorMessage = errorMessages[0];
              const currentError = form.formState.errors.fileName?.message;

              // 只在錯誤訊息不同時才設置錯誤，避免重複渲染
              if (currentError !== newErrorMessage) {
                form.setError("fileName", {
                  type: "validation",
                  message: newErrorMessage,
                });
              }
            }
          } else {
            // 只在有錯誤時才清除，避免不必要的操作
            if (form.formState.errors.fileName) {
              form.clearErrors("fileName");
            }
          }
        } catch (error) {
          console.error("Image validation error:", error);
        }
      })();
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      form.setValue("fileValue", base64, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false, // 不進行格式驗證，只設置值
      });

      const extension = selectedFile.name.split(".").pop() || "";
      const originalFileName = selectedFile.name;

      form.setValue("originalExtension", `.${extension}`, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false, // 不立即驗證
      });

      form.setValue("fileName", originalFileName, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false, // 不進行格式驗證，只設置值
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileNameChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newFileName = e.target.value;
    const originalExt = form.getValues("originalExtension");

    form.clearErrors("fileName");

    let finalFileName = newFileName;

    if (!newFileName.includes(".") && originalExt) {
      finalFileName = `${newFileName}${originalExt}`;

      form.setValue("fileName", finalFileName, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: false,
      });
    }

    const currentFile = form.getValues("fileValue");
    if (
      currentFile &&
      currentFile.startsWith("data:image/") &&
      validationManager
    ) {
      try {
        const fileBlob = await fetch(currentFile).then((r) => r.blob());
        const tempFile = new File([fileBlob], finalFileName, {
          type: fileBlob.type,
        });

        const validationResult = await validationManager.validateImage(
          tempFile,
          {
            t: (key: string, options?: Record<string, unknown>) =>
              t(key, options),
          }
        );

        if (validationResult.errors.length > 0) {
          const errorMessages = validationResult.errors
            .map((error) => error.message)
            .filter((msg): msg is string => !!msg);

          if (errorMessages.length > 0) {
            const newErrorMessage = errorMessages[0];
            const currentError = form.formState.errors.fileName?.message;

            // 只在錯誤訊息不同時才設置錯誤，避免重複渲染
            if (currentError !== newErrorMessage) {
              form.setError("fileName", {
                type: "validation",
                message: newErrorMessage,
              });
            }
          }
        } else {
          // 只在有錯誤時才清除，避免不必要的操作
          if (form.formState.errors.fileName) {
            form.clearErrors("fileName");
          }
        }
      } catch (error) {
        console.error("Re-validation error:", error);
      }
    }
  };

  const handleUpload = async (data: TImageUpload) => {
    try {
      form.clearErrors();

      if (!data.fileValue || !data.fileValue.startsWith("data:image/")) {
        form.setError("fileValue", {
          type: "validation",
          message: t("validation.image.content.format"),
        });
        return;
      }

      onUpload(data.fileName, data.fileValue);
      setOpen(false);
      resetState();
    } catch (error) {
      console.error("Upload validation error:", error);
    }
  };

  const fileName = form.watch("fileName");
  const fileValue = form.watch("fileValue");

  const isSubmitDisabled =
    !fileName ||
    !fileValue ||
    !!form.formState.errors.fileName ||
    !!form.formState.errors.fileValue;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-12",
            error &&
              "border-destructive text-destructive hover:bg-destructive/10"
          )}
        >
          <ImagePlus className="size-6" />
          <p className="text-sm">{t("dialog.imgUpload.title")}</p>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {t("dialog.imgUpload.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground"></DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem>
                    <TextInput
                      {...field}
                      label={t("dialog.imgUpload.fileName")}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFileNameChange(e);
                      }}
                      error={form.formState.errors.fileName}
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fileValue"
                render={() => (
                  <FormItem>
                    <Label htmlFor="image">
                      {t("dialog.imgUpload.description")}
                    </Label>
                    <Input
                      type="file"
                      id="image"
                      accept={allowedFormats.extensions.join(",")}
                      onChange={handleFileChange}
                      className={cn(
                        form.formState.errors.fileValue &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      {t("dialog.imgUpload.allowedFormats", {
                        formats: allowedFormats.extensions
                          .map((ext) => ext.toUpperCase().replace(".", ""))
                          .join("、"),
                      })}
                    </p>
                  </FormItem>
                )}
              />
            </div>
            {preview && (
              <div className="mt-4 space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 w-auto rounded-md object-contain"
                />
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("dialog.imgUpload.cancel")}
                </Button>
              </DialogClose>
              <Button
                type="button"
                disabled={isSubmitDisabled}
                onClick={form.handleSubmit(handleUpload)}
              >
                {t("dialog.imgUpload.submit")}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUpload;
