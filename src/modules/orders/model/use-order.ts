import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isEmpty } from "ramda";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { nullOnApiError } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useToast } from "@/shared/lib/use-toast";

import { listOrders, updateOrder } from "../api/orders";

import type { TOrder, EOrderStatus } from "./schema";
import type { TPagination } from "@/shared/api/schema";
import type { TGetResponseContent } from "@/shared/api/types";
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
      const response = (await listOrders(pageQuery ?? {}).catch(
        nullOnApiError
      )) as TGetResponseContent<TOrder[]> | null; // domain 型別（R18）

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("orders.toast.get.error"),
          variant: "destructive",
        });
        return null;
      }

      return response;
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
      const response = (await listOrders({ order_id }).catch(
        nullOnApiError
      )) as TGetResponseContent<TOrder[]> | null;

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("orders.toast.get.error"),
          variant: "destructive",
        });
        return null;
      }

      return response;
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
      const response = (await listOrders({ order_id }).catch(
        nullOnApiError
      )) as TGetResponseContent<TOrder[]> | null;

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("orders.toast.get.error"),
          variant: "destructive",
        });
        return null;
      }
      const data = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
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
      order_status: TOrder["order_status"];
    }) => {
      const response = await updateOrder({
        order_id,
        order_status,
      }).catch(nullOnApiError);

      if (!response) {
        toast({
          title: t("common.error"),
          description: t("orders.toast.update.error"),
          variant: "destructive",
        });
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orderList"] });
      toast({
        title: t("common.success"),
        description: t("orders.toast.update.success"),
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
