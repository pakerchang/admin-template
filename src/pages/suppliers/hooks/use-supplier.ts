import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { supplierSchema } from "@/services/schemas/supplier";
import { apiFetch } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useValidationMessage } from "@/shared/lib/gen-validate-message";
import { useToast } from "@/shared/lib/use-toast";

import type {
  TCreateSupplier,
  TUpdateSupplier,
  TSupplierQuery,
  TSupplier,
} from "@/services/schemas/supplier";
import type {
  TGetResponseContent,
  TPostResponseContent,
} from "@/shared/api/types";

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
        message: getMessage.getRequiredMessage("pages.supplier.supplierName"),
      }),
      contact_info: z.object({
        phone: z.string().min(1, {
          message: getMessage.getRequiredMessage("pages.supplier.phone"),
        }),
        email: z.string().email({
          message: t("validation.email.invalid"),
        }),
        address: z.string().min(1, {
          message: getMessage.getRequiredMessage("pages.supplier.address"),
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
      const response =
        await apiFetch<TGetResponseContent<TSupplier[]>>("/admin/supplier");

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("pages.supplier.messages.fetchListFailed"),
          variant: "destructive",
        });
        throw new Error(t("pages.supplier.messages.fetchListFailed"));
      }

      return response.body;
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
      const response = await apiFetch<TGetResponseContent<TSupplier[]>>(
        "/admin/supplier",
        {
          query: queryParams ?? {
            page: paginationSchema.parse({}).page,
            limit: paginationSchema.parse({}).limit,
          },
        }
      );

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("pages.supplier.messages.fetchListFailed"),
          variant: "destructive",
        });
        throw new Error(t("pages.supplier.messages.fetchListFailed"));
      }

      return response.body;
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
      const response = await apiFetch<TPostResponseContent>("/admin/supplier", {
        method: "POST",
        body: supplierData,
      });

      if (response.status !== 200) {
        throw new Error(t("pages.supplier.messages.createFailed"));
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: t("common.success"),
        description: t("pages.supplier.messages.createSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("pages.supplier.messages.createFailed"),
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
      const response = await apiFetch<TPostResponseContent>("/admin/supplier", {
        method: "PUT",
        body: supplierData,
      });

      if (response.status !== 200) {
        throw new Error(t("pages.supplier.messages.updateFailed"));
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: t("common.success"),
        description: t("pages.supplier.messages.updateSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("pages.supplier.messages.updateFailed"),
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
      const response = await apiFetch<TPostResponseContent>("/admin/supplier", {
        method: "DELETE",
        body: { supplier_id: supplierId },
      });

      if (response.status !== 200) {
        throw new Error(t("pages.supplier.messages.deleteFailed"));
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({
        title: t("common.success"),
        description: t("pages.supplier.messages.deleteSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("pages.supplier.messages.deleteFailed"),
        variant: "destructive",
      });
    },
  });
};
