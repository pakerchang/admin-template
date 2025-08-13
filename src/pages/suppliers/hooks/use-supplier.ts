import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import { useValidationMessage } from "@/lib/gen-validate-message";
import apiClient from "@/services/client";
import {
  supplierContract,
  supplierSchema,
} from "@/services/contracts/supplier";
import { paginationSchema } from "@/services/types/schema";

import type {
  TCreateSupplier,
  TUpdateSupplier,
  TSupplierQuery,
} from "@/services/contracts/supplier";

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
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.title"));
      }

      const client = apiClient(supplierContract, token);
      const response = await client.getAllSuppliers();

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
  const { getToken } = useAuth();
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
      const token = await getToken();
      if (!token) {
        const errorMsg = t("toast.auth.unauthorized.title");
        toast({
          title: errorMsg,
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        throw new Error(errorMsg);
      }

      const client = apiClient(supplierContract, token);
      const response = await client.getSuppliers({
        query: queryParams ?? {
          page: paginationSchema.parse({}).page,
          limit: paginationSchema.parse({}).limit,
        },
      });

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
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierData: TCreateSupplier) => {
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.title"));
      }

      const client = apiClient(supplierContract, token);
      const response = await client.createSupplier({
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
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierData: TUpdateSupplier) => {
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.title"));
      }

      const client = apiClient(supplierContract, token);
      const response = await client.updateSupplier({
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
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.title"));
      }

      const client = apiClient(supplierContract, token);
      const response = await client.deleteSupplier({
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
