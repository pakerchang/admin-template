import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "ramda";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/services/api-client";
import { paginationSchema } from "@/services/types/schema";

import type { TUser, TUserRole } from "@/services/schemas/user";
import type { TPagination, TGetResponseContent } from "@/services/types/schema";

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
      const response = await apiFetch<TGetResponseContent<TUser[]>>("/users", {
        query: pageQuery ?? {},
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.user.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body;
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
      const response = await apiFetch<TUser>("/user/me/profile");

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.user.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body;
    },
  });
};

export const useUpdateUserProfile = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TUser) => {
      const response = await apiFetch<TGetResponseContent<TUser>>(
        "/user/me/profile",
        { method: "PUT", body: data }
      );

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.user.update.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body.data;
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
      const response = await apiFetch<TGetResponseContent<{ role: TUserRole }>>(
        "/admin/user/role",
        { method: "POST", body: data }
      );

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.user.update.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body.data;
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
