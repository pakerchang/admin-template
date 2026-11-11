import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { nullOnApiError } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useToast } from "@/shared/lib/use-toast";

import {
  createStaff,
  deleteStaff,
  listStaffs,
  updateStaff,
} from "../api/team-members";

import type { TStaffQuery, TCreateStaffUser, TStaffUser } from "./schema";

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
      .min(
        1,
        t("validation.required.field", { field: t("team-members.account") })
      ),
    email: z.string().email(t("validation.email.invalid")),
    password: z
      .string()
      .min(8, t("team-members.validation.password.minLength"))
      .refine(validatePasswordComplexity, {
        message: t("team-members.validation.password.complexity"),
      }),
    first_name: z
      .string()
      .min(
        1,
        t("validation.required.field", { field: t("team-members.firstName") })
      ),
    last_name: z
      .string()
      .min(
        1,
        t("validation.required.field", { field: t("team-members.lastName") })
      ),
    role: z
      .string()
      .min(
        1,
        t("validation.required.field", { field: t("team-members.role") })
      ),
  });

  return staffFormSchema;
};

export const useUpdateStaffSchema = () => {
  const { t } = useTranslation();

  const updateStaffFormSchema = z.object({
    account: z
      .string()
      .min(
        1,
        t("validation.required.field", { field: t("team-members.account") })
      ),
    first_name: z
      .string()
      .min(
        1,
        t("validation.required.field", { field: t("team-members.firstName") })
      ),
    last_name: z
      .string()
      .min(
        1,
        t("validation.required.field", { field: t("team-members.lastName") })
      ),
    role: z
      .string()
      .min(
        1,
        t("validation.required.field", { field: t("team-members.role") })
      ),
  });

  return updateStaffFormSchema;
};

export type TStaffCreateForm = z.infer<ReturnType<typeof useCreateStaffSchema>>;
export type TStaffUpdateForm = z.infer<ReturnType<typeof useUpdateStaffSchema>>;

export const useGetStaffList = (query: Partial<TStaffQuery>) => {
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
      const response = await listStaffs(queryParams ?? {}).catch(
        nullOnApiError
      );

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("team-members.toast.get.listError"),
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

export const useCreateStaff = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData: TCreateStaffUser) => {
      const response = await createStaff(staffData).catch(nullOnApiError);

      if (!response) {
        throw new Error(t("team-members.toast.create.error"));
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: t("common.success"),
        description: t("team-members.toast.create.success"),
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("team-members.toast.create.error"),
        variant: "destructive",
      });
    },
  });
};

export const useUpdateStaff = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData: TStaffUser) => {
      const response = await updateStaff(staffData).catch(nullOnApiError);

      if (!response) {
        throw new Error(t("team-members.toast.update.error"));
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: t("common.success"),
        description: t("team-members.toast.update.success"),
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("team-members.toast.update.error"),
        variant: "destructive",
      });
    },
  });
};

export const useDeleteStaff = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      const response = await deleteStaff({ staff_id: staffId }).catch(
        nullOnApiError
      );

      if (!response) {
        throw new Error(t("team-members.toast.delete.error"));
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast({
        title: t("common.success"),
        description: t("team-members.toast.delete.success"),
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("team-members.toast.delete.error"),
        variant: "destructive",
      });
    },
  });
};
