import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "ramda";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { apiFetch } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useToast } from "@/shared/lib/use-toast";

import type { TOrder, EOrderStatus } from "./schema";
import type { TPagination } from "@/shared/api/schema";
import type {
  TGetResponseContent,
  TPostResponseContent,
} from "@/shared/api/types";
import type { ApiSortingParams } from "@/shared/ui/data-table";

export const useGetOrderList = (
  pagination: Partial<TPagination> &
    ApiSortingParams & { order_status?: EOrderStatus }
) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const pageQuery = useMemo(() => {
    if (isEmpty(pagination)) return undefined;
    return {
      page: pagination.page ? pagination.page : paginationSchema.parse({}).page,
      limit: pagination.limit
        ? pagination.limit
        : paginationSchema.parse({}).limit,
      ...(pagination.sort_by && { sort_by: pagination.sort_by }),
      ...(pagination.order && { order: pagination.order }),
      ...(pagination.order_status && { order_status: pagination.order_status }),
    };
  }, [pagination]);

  const queryKey = useMemo(() => {
    const page = pagination.page ?? paginationSchema.parse({}).page;
    const limit = pagination.limit ?? paginationSchema.parse({}).limit;
    return [
      "orderList",
      page,
      limit,
      pagination.sort_by,
      pagination.order,
      pagination.order_status,
    ];
  }, [
    pagination.page,
    pagination.limit,
    pagination.sort_by,
    pagination.order,
    pagination.order_status,
  ]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiFetch<TGetResponseContent<TOrder[]>>(
        "/admin/order",
        {
          query: pageQuery ?? {},
        }
      );

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.order.get.error"),
          variant: "destructive",
        });
        return null;
      }

      return response.body;
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
};

export const useGetOrder = (order_id: string) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useQuery({
    queryKey: ["order", order_id],
    queryFn: async () => {
      const response = await apiFetch<TGetResponseContent<TOrder[]>>(
        "/admin/order",
        {
          query: { order_id },
        }
      );

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.order.get.error"),
          variant: "destructive",
        });
        return null;
      }

      return response.body;
    },
    enabled: !!order_id,
  });
};

export const useGetOrderDetail = (order_id: string) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["orderDetail", order_id],
    queryFn: async () => {
      const response = await apiFetch<TGetResponseContent<TOrder[]>>(
        "/admin/order",
        {
          query: { order_id },
        }
      );

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.order.get.error"),
          variant: "destructive",
        });
        return null;
      }
      const data = Array.isArray(response.body.data)
        ? response.body.data[0]
        : response.body.data;
      return data;
    },
    initialData: () => {
      const orderListsData = queryClient.getQueriesData<TOrder[]>({
        queryKey: ["orders"],
        exact: false,
      });

      for (const [, listData] of orderListsData) {
        if (Array.isArray(listData)) {
          const foundOrder = listData.find(
            (order) => order.order_id === order_id
          );
          if (foundOrder) {
            return foundOrder;
          }
        }
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    enabled: !!order_id,
  });
};

export const useUpdateOrderStatus = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      order_id,
      order_status,
    }: {
      order_id: TOrder["order_id"];
      order_status: EOrderStatus;
    }) => {
      const response = await apiFetch<TPostResponseContent>(
        "/admin/order/update",
        {
          method: "POST",
          body: {
            order_id,
            order_status,
          },
        }
      );

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.order.update.error"),
          variant: "destructive",
        });
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orderList"] });
      toast({
        title: t("common.success"),
        description: t("toast.order.update.success"),
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
