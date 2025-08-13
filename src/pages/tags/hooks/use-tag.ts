import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/client";
import { tagContract, tagSchema } from "@/services/contracts/tag";
import { paginationSchema } from "@/services/types/schema";

import type {
  TCreateTag,
  TTagQuery,
  TUpdateTag,
  TDeleteTag,
} from "@/services/contracts/tag";

export const useCreateTagSchema = () => {
  const { t } = useTranslation();

  const tagFormSchema = tagSchema
    .omit({
      tag_id: true,
    })
    .extend({
      tag_name: z.string().min(1, {
        message: t("validation.required.field", { field: "標籤名稱" }),
      }),
    });

  return tagFormSchema;
};

export type TTagForm = z.infer<ReturnType<typeof useCreateTagSchema>>;

export const useGetAllTags = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["tags", "all"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.title"));
      }

      const client = apiClient(tagContract, token);
      const response = await client.getAllTags();

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("pages.tag.messages.fetchListFailed"),
          variant: "destructive",
        });
        throw new Error(t("pages.tag.messages.fetchListFailed"));
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

export const useGetTagList = (query: Partial<TTagQuery>) => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const queryParams = useMemo(() => {
    const hasContent =
      query.page || query.limit || query.sort_by || query.order || query.search;
    if (!hasContent) return undefined;

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
      "tags",
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

      const client = apiClient(tagContract, token);
      const response = await client.getTags({
        query: queryParams ?? {
          page: paginationSchema.parse({}).page,
          limit: paginationSchema.parse({}).limit,
        },
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("pages.tag.messages.fetchListFailed"),
          variant: "destructive",
        });
        throw new Error(t("pages.tag.messages.fetchListFailed"));
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

export const useCreateTag = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: TCreateTag) => {
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.title"));
      }

      const client = apiClient(tagContract, token);
      const response = await client.createTag({
        body: tagData,
      });

      if (response.status !== 200) {
        throw new Error(t("pages.tag.messages.createFailed"));
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({
        title: t("common.success"),
        description: t("pages.tag.messages.createSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("pages.tag.messages.createFailed"),
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTag = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: TUpdateTag) => {
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.title"));
      }

      const client = apiClient(tagContract, token);
      const response = await client.updateTag({
        body: tagData,
      });

      if (response.status !== 200) {
        throw new Error(t("pages.tag.messages.updateFailed"));
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({
        title: t("common.success"),
        description: t("pages.tag.messages.updateSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("pages.tag.messages.updateFailed"),
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTag = () => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: TDeleteTag) => {
      const token = await getToken();
      if (!token) {
        throw new Error(t("toast.auth.unauthorized.title"));
      }

      const client = apiClient(tagContract, token);
      const response = await client.deleteTag({
        body: tagData,
      });

      if (response.status !== 200) {
        throw new Error(t("pages.tag.messages.deleteFailed"));
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({
        title: t("common.success"),
        description: t("pages.tag.messages.deleteSuccess"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("pages.tag.messages.deleteFailed"),
        variant: "destructive",
      });
    },
  });
};
