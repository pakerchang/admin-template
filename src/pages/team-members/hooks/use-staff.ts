import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/client";
import { staffContract } from "@/services/contracts/staff";
import { paginationSchema } from "@/services/types/schema";

import type {
  TStaffQuery,
  TCreateStaffUser,
  TStaffUser,
} from "@/services/contracts/staff";

const validatePasswordComplexity = (password: string) => {
  if (password.length < 8) return false;

  const patterns = [
    /[A-Z]/, // 大寫字母
    /[a-z]/, // 小寫字母
    /[0-9]/, // 數字
    /[!@#$%^&*()]/, // 特殊符號
  ];

  const matchedPatterns = patterns.filter((pattern) => pattern.test(password));
  return matchedPatterns.length >= 3;
};

export const useCreateStaffSchema = () => {
  const { t } = useTranslation();

  const staffFormSchema = z.object({
    account: z
      .string()
      .min(1, t("validation.required.field", { field: t("staff.account") })),
    email: z.string().email(t("validation.email.invalid")),
    password: z
      .string()
      .min(8, t("validation.password.minLength"))
      .refine(validatePasswordComplexity, {
        message: t("validation.password.complexity"),
      }),
    first_name: z
      .string()
      .min(1, t("validation.required.field", { field: t("staff.firstName") })),
    last_name: z
      .string()
      .min(1, t("validation.required.field", { field: t("staff.lastName") })),
    role: z
      .string()
      .min(1, t("validation.required.field", { field: t("staff.role") })),
  });

  return staffFormSchema;
};

export const useUpdateStaffSchema = () => {
  const { t } = useTranslation();

  const updateStaffFormSchema = z.object({
    account: z
      .string()
      .min(1, t("validation.required.field", { field: t("staff.account") })),
    first_name: z
      .string()
      .min(1, t("validation.required.field", { field: t("staff.firstName") })),
    last_name: z
      .string()
      .min(1, t("validation.required.field", { field: t("staff.lastName") })),
    role: z
      .string()
      .min(1, t("validation.required.field", { field: t("staff.role") })),
  });

  return updateStaffFormSchema;
};

export type TStaffCreateForm = z.infer<ReturnType<typeof useCreateStaffSchema>>;
export type TStaffUpdateForm = z.infer<ReturnType<typeof useUpdateStaffSchema>>;

export const useGetStaffList = (query: Partial<TStaffQuery>) => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const queryParams = useMemo(() => {
    const hasContent =
      query.page ||
      query.limit ||
      query.sort_by ||
      query.order ||
      query.role ||
      query.staff_id;
    if (!hasContent) return undefined;

    return {
      page: query.page ?? paginationSchema.parse({}).page,
      limit: query.limit ?? paginationSchema.parse({}).limit,
      ...(query.sort_by && { sort_by: query.sort_by }),
      ...(query.order && { order: query.order }),
      ...(query.role && { role: query.role }),
      ...(query.staff_id && { staff_id: query.staff_id }),
    };
  }, [query]);

  const queryKey = useMemo(() => {
    return [
      "staff",
      query.page ?? paginationSchema.parse({}).page,
      query.limit ?? paginationSchema.parse({}).limit,
      query.sort_by,
      query.order,
      query.role,
      query.staff_id,
    ];
  }, [
    query.page,
    query.limit,
    query.sort_by,
    query.order,
    query.role,
    query.staff_id,
  ]);

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

      const client = apiClient(staffContract, token);
      const response = await client.getStaff({
        query: queryParams ?? {},
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: "獲取員工列表失敗",
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

export const useCreateStaff = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData: TCreateStaffUser) => {
      const token = await getToken();
      if (!token) {
        throw new Error("未授權");
      }

      const client = apiClient(staffContract, token);
      const response = await client.createStaff({
        body: staffData,
      });

      if (response.status !== 200) {
        throw new Error("創建員工失敗");
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "成功",
        description: "員工創建成功",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || "創建員工失敗",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateStaff = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData: TStaffUser) => {
      const token = await getToken();
      if (!token) {
        throw new Error("未授權");
      }

      const client = apiClient(staffContract, token);
      const response = await client.updateStaff({
        body: staffData,
      });

      if (response.status !== 200) {
        throw new Error("更新員工失敗");
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "成功",
        description: "員工資料更新成功",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || "更新員工失敗",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteStaff = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error("未授權");
      }

      const client = apiClient(staffContract, token);
      const response = await client.deleteStaff({
        body: { staff_id: staffId },
      });

      if (response.status !== 200) {
        throw new Error("刪除員工失敗");
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: "成功",
        description: "員工刪除成功",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || "刪除員工失敗",
        variant: "destructive",
      });
    },
  });
};
