import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { nullOnApiError } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useValidationMessage } from "@/shared/lib/gen-validate-message";
import { useToast } from "@/shared/lib/use-toast";

import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from "../api/suppliers";

import { supplierSchema } from "./schema";

import type {
  TCreateSupplier,
  TUpdateSupplier,
  TSupplierQuery,
} from "./schema";

export const useCreateSupplierSchema = () => {
  const getMessage = useValidationMessage();
  const { t } = useTranslation();

  const supplierFormSchema = supplierSchema
    .omit({
      supplier_id: true,
      created_at: true,
      updated_at: true,
    })
    .extend({
      supplier_name: z.string().min(1, {
        message: getMessage.getRequiredMessage("suppliers.supplierName"),
      }),
      contact_info: z.object({
        phone: z.string().min(1, {
          message: getMessage.getRequiredMessage("suppliers.phone"),
        }),
        email: z.string().email({
          message: t("validation.email.invalid"),
        }),
        address: z.string().min(1, {
          message: getMessage.getRequiredMessage("suppliers.address"),
        }),
      }),
      remark: z.string().optional(),
    });

  return supplierFormSchema;
};

export type TSupplierForm = z.infer<ReturnType<typeof useCreateSupplierSchema>>;

export const useGetSupplierAll = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: async () => {
      const response = await listSuppliers().catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("suppliers.messages.fetchListFailed"),
          variant: "destructive",
        });
        throw new Error(t("suppliers.messages.fetchListFailed"));
      }

      return response;
    },
    gcTime: 1000 * 60 * 5, // 5分鐘緩存
    staleTime: 1000 * 60 * 2, // 2分鐘內不重新請求
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
};

export const useGetSupplierList = (query: Partial<TSupplierQuery>) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const queryParams = useMemo(() => {
    return {
      page: query.page ?? paginationSchema.parse({}).page,
      limit: query.limit ?? paginationSchema.parse({}).limit,
      ...(query.sort_by && { sort_by: query.sort_by }),
      ...(query.order && { order: query.order }),
      ...(query.search && { search: query.search }),
    };
  }, [query]);

  const queryKey = useMemo(() => {
    return [
      "suppliers",
      query.page ?? paginationSchema.parse({}).page,
      query.limit ?? paginationSchema.parse({}).limit,
      query.sort_by,
      query.order,
      query.search,
    ];
  }, [query.page, query.limit, query.sort_by, query.order, query.search]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await listSuppliers(
        queryParams ?? {
          page: paginationSchema.parse({}).page,
          limit: paginationSchema.parse({}).limit,
        }
      ).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("suppliers.messages.fetchListFailed"),
          variant: "destructive",
        });
        throw new Error(t("suppliers.messages.fetchListFailed"));
      }

      return response;
    },
    gcTime: 1000 * 60 * 5, // 5分鐘緩存
    staleTime: 1000 * 60 * 2, // 2分鐘內不重新請求
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
};

export const useCreateSupplier = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierData: TCreateSupplier) => {
      const response = await createSupplier(supplierData).catch(nullOnApiError);

      if (!response) {
        throw new Error(t("suppliers.messages.createFailed"));
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: t("common.success"),
        description: t("suppliers.messages.createSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("suppliers.messages.createFailed"),
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSupplier = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierData: TUpdateSupplier) => {
      const response = await updateSupplier(supplierData).catch(nullOnApiError);

      if (!response) {
        throw new Error(t("suppliers.messages.updateFailed"));
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: t("common.success"),
        description: t("suppliers.messages.updateSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("suppliers.messages.updateFailed"),
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSupplier = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await deleteSupplier({ supplier_id: supplierId }).catch(
        nullOnApiError
      );

      if (!response) {
        throw new Error(t("suppliers.messages.deleteFailed"));
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: t("common.success"),
        description: t("suppliers.messages.deleteSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("suppliers.messages.deleteFailed"),
        variant: "destructive",
      });
    },
  });
};
