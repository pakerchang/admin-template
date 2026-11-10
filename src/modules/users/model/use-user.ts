import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "ramda";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { nullOnApiError } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useToast } from "@/shared/lib/use-toast";

import {
  getMyProfile,
  listUsers,
  updateMyProfile,
  updateUserRole,
} from "../api/users";

import type { TUser, TUserRole } from "./schema";
import type { TPagination } from "@/shared/api/schema";

export const useGetUserList = (pagination: Partial<TPagination>) => {
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

  return useQuery({
    queryKey: ["users", pagination.page, pagination.limit],
    queryFn: async () => {
      const response = await listUsers(pageQuery ?? {}).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.user.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response;
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
};

export const useGetUserProfile = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const response = await getMyProfile().catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.user.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response;
    },
  });
};

export const useUpdateUserProfile = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TUser) => {
      const response = await updateMyProfile(data).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.user.update.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.data;
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      target_user_id: TUser["user_id"];
      role: TUserRole;
    }) => {
      const response = await updateUserRole(data).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("toast.user.update.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: t("common.success"),
        description: t("toast.user.update.success"),
        variant: "success",
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
