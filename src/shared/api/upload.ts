import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeepCompareEffect } from "react-use";

import { fetcher, nullOnApiError } from "@/shared/api/fetcher";
import { useToast } from "@/shared/lib/use-toast";

import type { TImageResponseSchema } from "@/shared/api/schema";
import type { TPostResponseContent } from "@/shared/api/types";

type ImageUploadResponse = {
  file_url: string;
};

export const useImgUpload = (initialImages: TImageResponseSchema[] = []) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [uploadedImages, setUploadedImages] =
    useState<TImageResponseSchema[]>(initialImages);

  useDeepCompareEffect(() => {
    setUploadedImages(initialImages);
  }, [initialImages]);

  const uploadMutation = useMutation({
    mutationFn: async ({
      fileName,
      base64,
    }: {
      fileName: string;
      base64: string;
    }) => {
      // R29：core operation，client 手寫、經同一個 mutator
      const response = await fetcher<ImageUploadResponse>("/admin/images", {
        method: "POST",
        body: JSON.stringify({ file_name: fileName, file_value: base64 }),
      }).catch(nullOnApiError);

      if (!response) {
        throw new Error(t("toast.img.upload.error"));
      }

      return response;
    },
    onSuccess: (src, variables) => {
      const { fileName } = variables;
      const { file_url } = src;

      if (file_url) {
        setUploadedImages((prev) => [
          ...prev,
          {
            file_name: fileName,
            file_url,
          },
        ]);
        toast({
          title: t("common.success"),
          description: t("toast.img.upload.success"),
          variant: "success",
        });
      }
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (payload: { file_names: string[] }) => {
      const response = await fetcher<TPostResponseContent>("/admin/images", {
        method: "DELETE",
        body: JSON.stringify(payload),
      }).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.img.delete.error"),
          variant: "destructive",
        });
        return null;
      }

      return payload.file_names;
    },
    onSuccess: (fileNames) => {
      if (fileNames) {
        setUploadedImages((prev) =>
          prev.filter((image) => !fileNames.includes(image.file_name))
        );
        toast({
          title: t("common.success"),
          description: t("toast.img.delete.success"),
          variant: "success",
        });
      }
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const upload = (fileName: string, base64: string) => {
    uploadMutation.mutate({ fileName, base64 });
  };

  const removeImage = (src: string | TImageResponseSchema[]) => {
    removeMutation.mutate({
      file_names: Array.isArray(src) ? src.map((c) => c.file_name) : [src],
    });
  };

  return {
    upload,
    removeImage,
    uploadedImages,
    isUploading: uploadMutation.isPending,
  };
};
