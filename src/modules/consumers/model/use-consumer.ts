import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { nullOnApiError } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useToast } from "@/shared/lib/use-toast";

import { listCustomers, listTransactionHistory } from "../api/consumers";

import type {
  TCustomerQuery,
  TTransactionHistoryQuery,
  TCustomer,
  TTransactionHistoryResponse,
} from "./schema";
import type { TGetResponseContent } from "@/shared/api/types";

export const useGetCustomerList = (query: Partial<TCustomerQuery>) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const queryParams = useMemo(() => {
    const hasContent =
      query.page ||
      query.limit ||
      query.sort_by ||
      query.order ||
      query.user_id;
    if (!hasContent) return undefined;

    return {
      page: query.page ?? paginationSchema.parse({}).page,
      limit: query.limit ?? paginationSchema.parse({}).limit,
      sort_by: query.sort_by ?? "total_spent",
      order: query.order ?? "DESC",
      ...(query.user_id && { user_id: query.user_id }),
    };
  }, [query]);

  const queryKey = useMemo(() => {
    return [
      "customers",
      query.page ?? paginationSchema.parse({}).page,
      query.limit ?? paginationSchema.parse({}).limit,
      query.sort_by,
      query.order,
      query.user_id,
    ];
  }, [query.page, query.limit, query.sort_by, query.order, query.user_id]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = (await listCustomers(queryParams ?? {}).catch(
        nullOnApiError
      )) as TGetResponseContent<TCustomer[]> | null; // domain 型別（R18）

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("consumers.toast.get.listError"),
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

export const useGetTransactionHistory = (
  query: Partial<TTransactionHistoryQuery>
) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const queryParams = useMemo(() => {
    if (!query.user_id) return undefined;
    return {
      user_id: query.user_id,
      page: query.page ?? paginationSchema.parse({}).page,
      limit: query.limit ?? paginationSchema.parse({}).limit,
    };
  }, [query.user_id, query.page, query.limit]);

  const queryKey = useMemo(() => {
    return ["transaction-history", queryParams];
  }, [queryParams]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = (await listTransactionHistory(
        queryParams ?? { user_id: "", page: 1, limit: 5 }
      ).catch(nullOnApiError)) as TTransactionHistoryResponse | null;

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("consumers.toast.get.transactionError"),
          variant: "destructive",
        });
        return undefined;
      }

      return response;
    },
    enabled: !!query.user_id,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: (prev) => prev,
  });
};
