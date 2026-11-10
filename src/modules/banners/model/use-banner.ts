import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { isEmpty } from "ramda";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { nullOnApiError } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useValidationMessage } from "@/shared/lib/gen-validate-message";
import { useToast } from "@/shared/lib/use-toast";

import {
  createBanner,
  deleteBanner,
  listBanners,
  updateBanner,
} from "../api/banners";

import { bannerSchema } from "./schema";

import type { TBanner } from "./schema";
import type { TPagination } from "@/shared/api/schema";

export const useGetBannerList = (pagination: Partial<TPagination>) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const pageQuery = useMemo(() => {
    if (isEmpty(pagination)) return undefined;
    return {
      page: pagination.page ? pagination.page : paginationSchema.parse({}).page,
      limit: pagination.limit
        ? pagination.limit
        : paginationSchema.parse({}).limit,
    };
  }, [pagination]);

  const queryKey = useMemo(() => {
    const page = pagination.page ?? paginationSchema.parse({}).page;
    const limit = pagination.limit ?? paginationSchema.parse({}).limit;
    return ["bannerList", page, limit];
  }, [pagination.page, pagination.limit]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await listBanners(pageQuery ?? {}).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      const activeBanners = response.data?.filter(
        (d) => d.banner_status === "active"
      );
      const inactiveBanners = response.data?.filter(
        (d) => d.banner_status === "inactive"
      );

      return {
        activeBanners,
        inactiveBanners,
        total: response.total,
      };
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
};

export const useGetBanner = (id: string) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["getBanner", id],
    queryFn: async () => {
      const response = await listBanners({ banner_id: id }).catch(
        nullOnApiError
      );

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (
      data: Omit<TBanner, "banner_id" | "created_at" | "updated_at">
    ) => {
      const response = await createBanner(data).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.create.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bannerList"] });

      toast({
        title: t("common.success"),
        description: t("toast.banner.create.success"),
        variant: "success",
      });
      navigate({
        to: "/banners",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TBanner) => {
      const response = await updateBanner(data).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.update.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bannerList"] });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: TBanner["banner_id"]) => {
      const response = await deleteBanner({ banner_id: id }).catch(
        nullOnApiError
      );

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.delete.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response;
    },
    onSuccess: (response) => {
      // mutationFn 在 API 錯誤時回 undefined（已 toast 錯誤）：不可再報成功
      if (!response) return;
      queryClient.invalidateQueries({ queryKey: ["bannerList"] });
      toast({
        title: t("common.success"),
        description: t("toast.banner.delete.success"),
        variant: "success",
      });
    },
  });
};

export const useCreateBannerSchema = () => {
  const getMessage = useValidationMessage();
  const { t } = useTranslation();

  const bannerFormSchema = bannerSchema
    .omit({
      banner_id: true,
      created_at: true,
      updated_at: true,
    })
    .extend({
      title: z.string().min(1, {
        message: getMessage.getRequiredMessage(
          "pages.banner.bannerCreate.title"
        ),
      }),
      redirect_url: z
        .string()
        .min(1, {
          message: getMessage.getRequiredMessage(
            "pages.banner.bannerCreate.redirectUrl"
          ),
        })
        .url({
          message: t("validation.url.invalid"),
        })
        .refine((url) => url.startsWith("https://"), {
          message: t("validation.url.https"),
        }),
      desktop_image_url: z.string().min(1, {
        message: getMessage.getRequiredMessage(
          "pages.banner.bannerCreate.desktopImage"
        ),
      }),
      mobile_image_url: z.string().min(1, {
        message: getMessage.getRequiredMessage(
          "pages.banner.bannerCreate.mobileImage"
        ),
      }),
    });

  return bannerFormSchema;
};

export type TBannerForm = z.infer<ReturnType<typeof useCreateBannerSchema>>;
