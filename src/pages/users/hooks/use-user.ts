import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "ramda";
import { useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/client";
import { userContract } from "@/services/contracts/user";
import { paginationSchema } from "@/services/types/schema";

import type { TUser, TUserRole } from "@/services/contracts/user";
import type { TPagination } from "@/services/types/schema";

export const useGetUserList = (pagination: Partial<TPagination>) => {
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

  return useQuery({
    queryKey: ["users", pagination.page, pagination.limit],
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

      const client = apiClient(userContract, token);
      const response = await client.getUserList({
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

      return response.body.data;
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
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["user", "profile"],
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

      const client = apiClient(userContract, token);
      const response = await client.getUserProfile();

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

const useGetUserRole = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["user", "role"],
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

      const client = apiClient(userContract, token);
      const response = await client.getUserRole();

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
    gcTime: 1000 * 60 * 60 * 24,
    staleTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
  });
};

export const useGlobalPrefetchUserRole = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchGlobalUserRole = async () => {
      try {
        const token = await getToken();
        if (token) {
          const cachedData = queryClient.getQueryData(["user", "role"]);
          if (!cachedData) {
            await queryClient.prefetchQuery({
              queryKey: ["user", "role"],
              queryFn: async () => {
                const client = apiClient(userContract, token);
                const response = await client.getUserRole();

                if (response.status !== 200) {
                  throw new Error("Failed to fetch user role");
                }

                return response.body;
              },
              staleTime: 1000 * 60 * 60,
              gcTime: 1000 * 60 * 60 * 24,
            });
          }
        }
      } catch (error) {
        console.warn("Failed to prefetch global user role:", error);
      }
    };

    prefetchGlobalUserRole();
  }, [getToken, queryClient]);
};

export const useUpdateUserProfile = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TUser) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(userContract, token);
      const response = await client.updateUserProfile({
        body: data,
      });

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
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      target_user_id: TUser["user_id"];
      role: TUserRole;
    }) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(userContract, token);
      const response = await client.updateUserRole({
        body: data,
      });

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

export const useUserPermissions = () => {
  const { data: userRoleResponse, isLoading } = useGetUserRole();

  const userRole = userRoleResponse?.role ?? "superadmin";

  return {
    userRole,
    isLoading,
    // 基礎權限檢查
    isAdmin: Boolean(["admin", "superadmin"].includes(userRole)),
    isSuperAdmin: Boolean(["superadmin"].includes(userRole)),
    isPartner: Boolean(["partner"].includes(userRole)),
    isPremium: Boolean(["premium"].includes(userRole)),
    isUser: Boolean(["user"].includes(userRole)),
    isGuest: Boolean(["guest"].includes(userRole)),
    isSupport: Boolean(["support"].includes(userRole)),

    // 業務權限組合
    canAccessAdminPanel: Boolean(["admin", "superadmin"].includes(userRole)),
    canViewUserList: Boolean(["admin", "superadmin"].includes(userRole)),
    canEditUserRole: Boolean(["superadmin"].includes(userRole)),
    canManageUsers: Boolean(["superadmin"].includes(userRole)),
    canManageProducts: Boolean(
      ["admin", "superadmin", "partner"].includes(userRole)
    ),
    canManageOrders: Boolean(
      ["admin", "superadmin", "support"].includes(userRole)
    ),
    canViewReports: Boolean(["admin", "superadmin"].includes(userRole)),
  };
};
