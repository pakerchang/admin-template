import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X } from "lucide-react";
import { useState } from "react";
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
import { useImgUpload } from "@/hooks/use-img-upload";

interface ImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string, alt?: string) => void;
}

const ImageDialog = ({ isOpen, onClose, onSave }: ImageDialogProps) => {
  const { t } = useTranslation();
  const { upload, uploadedImages, removeImage, isUploading } = useImgUpload();
  const [activeTab, setActiveTab] = useState("upload");

  const urlSchema = z.object({
    url: z
      .string()
      .min(1, { message: t("validation.editor.image.url") })
      .url({ message: t("validation.url.invalid") }),
    alt: z.string().optional(),
  });

  type UrlFormData = z.infer<typeof urlSchema>;

  const form = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
      alt: "",
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          upload(file.name, base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (data: UrlFormData) => {
    onSave(data.url, data.alt);
    handleClose();
  };

  const handleUploadedImageSave = (imageIndex: number) => {
    if (uploadedImages[imageIndex]) {
      const image = uploadedImages[imageIndex];
      onSave(image.file_url, image.file_name);
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setActiveTab("upload");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("validation.editor.toolbar.image")}</DialogTitle>
        </DialogHeader>

        <div className="w-full">
          <div className="mb-4 flex space-x-1 rounded-lg bg-muted p-1">
            <Button
              type="button"
              variant={activeTab === "upload" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab("upload")}
            >
              {t("validation.editor.image.upload")}
            </Button>
            <Button
              type="button"
              variant={activeTab === "url" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setActiveTab("url")}
            >
              {t("validation.editor.image.url")}
            </Button>
          </div>

          {activeTab === "upload" && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex w-full items-center justify-center">
                  <label
                    htmlFor="image-upload"
                    className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <Upload className="mb-2 size-8 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        {t("validation.editor.image.uploadText")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("validation.editor.image.uploadHint")}
                      </p>
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {isUploading && (
                  <div className="flex items-center justify-center">
                    <div className="text-sm text-muted-foreground">
                      {t("validation.editor.image.uploading")}
                    </div>
                  </div>
                )}

                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t("validation.editor.image.uploaded")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((image, index) => (
                        <div key={image.file_name} className="group relative">
                          <img
                            src={image.file_url}
                            alt={image.file_name}
                            className="h-24 w-full rounded border object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center space-x-2 rounded bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleUploadedImageSave(index)}
                            >
                              {t("validation.editor.image.use")}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeImage(image.file_name)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "url" && (
            <form
              onSubmit={form.handleSubmit(handleUrlSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="image-url">
                  {t("validation.editor.image.url")}
                </Label>
                <Input
                  id="image-url"
                  placeholder={t("validation.editor.image.urlPlaceholder")}
                  {...form.register("url")}
                  className={
                    form.formState.errors.url ? "border-destructive" : ""
                  }
                />
                {form.formState.errors.url && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.url.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-alt">
                  {t("validation.editor.image.alt")}
                </Label>
                <Input
                  id="image-alt"
                  placeholder={t("validation.editor.image.altPlaceholder")}
                  {...form.register("alt")}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit">{t("common.insert")}</Button>
              </DialogFooter>
            </form>
          )}
        </div>

        {activeTab === "upload" && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageDialog;
