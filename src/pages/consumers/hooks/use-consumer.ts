import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/client";
import { customerContract } from "@/services/contracts/customer";
import { paginationSchema } from "@/services/types/schema";

import type {
  TCustomerQuery,
  TTransactionHistoryQuery,
} from "@/services/contracts/customer";

export const useGetCustomerList = (query: Partial<TCustomerQuery>) => {
  const { getToken } = useAuth();
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
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(customerContract, token);
      const response = await client.getCustomers({
        query: queryParams ?? {},
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: "獲取客戶列表失敗",
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

export const useGetTransactionHistory = (
  query: Partial<TTransactionHistoryQuery>
) => {
  const { getToken } = useAuth();
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
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(customerContract, token);
      const response = await client.getTransactionHistory({
        query: queryParams ?? { user_id: "", page: 1, limit: 5 },
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: "獲取交易記錄失敗",
          variant: "destructive",
        });
        return undefined;
      }

      return response.body;
    },
    enabled: !!query.user_id,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: (prev) => prev,
  });
};
