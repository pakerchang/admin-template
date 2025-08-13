import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeepCompareEffect } from "react-use";

import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/client";
import { productContract } from "@/services/contracts/product";

import type { TImageResponseSchema } from "@/services/types/schema";

type ImageUploadResponse = {
  file_url: string;
};

export const useImgUpload = (initialImages: TImageResponseSchema[] = []) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getToken } = useAuth();

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
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.description"));
      }

      const client = apiClient(productContract, token);
      const response = await client.uploadProductImage({
        body: {
          file_name: fileName,
          file_value: base64,
        },
      });

      if (response.status !== 200) {
        throw new Error(t("toast.img.upload.error"));
      }

      return response.body as unknown as ImageUploadResponse;
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
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return null;
      }

      const client = apiClient(productContract, token);
      const response = await client.deleteProductImage({
        body: payload,
      });

      if (response.status !== 200) {
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
