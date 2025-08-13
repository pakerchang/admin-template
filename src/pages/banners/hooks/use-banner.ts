import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { isEmpty } from "ramda";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import { useValidationMessage } from "@/lib/gen-validate-message";
import apiClient from "@/services/client";
import { bannerContract, bannerSchema } from "@/services/contracts/banner";
import { paginationSchema } from "@/services/types/schema";

import type { TBanner } from "@/services/contracts/banner";
import type { TPagination } from "@/services/types/schema";

export const useGetBannerList = (pagination: Partial<TPagination>) => {
  const { getToken } = useAuth();
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
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(bannerContract, token);
      const response = await client.getBanners({
        query: pageQuery ?? {},
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      const activeBanners = response.body.data?.filter(
        (d) => d.banner_status === "active"
      );
      const inactiveBanners = response.body.data?.filter(
        (d) => d.banner_status === "inactive"
      );

      return {
        activeBanners,
        inactiveBanners,
        total: response.body.total,
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
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["getBanner", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(bannerContract, token);
      const response = await client.getBanner({
        query: { banner_id: id },
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body.data;
    },
    enabled: !!id,
  });
};

export const useCreateBanner = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (
      data: Omit<TBanner, "banner_id" | "created_at" | "updated_at">
    ) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(bannerContract, token);
      const response = await client.createBanner({
        body: data,
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.create.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body;
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
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TBanner) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(bannerContract, token);
      const response = await client.updateBanner({
        body: data,
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.update.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body;
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
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: TBanner["banner_id"]) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(bannerContract, token);
      const response = await client.deleteBanner({
        body: { banner_id: id },
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.banner.delete.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body;
    },
    onSuccess: () => {
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
