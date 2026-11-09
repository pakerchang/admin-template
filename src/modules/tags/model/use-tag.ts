import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { apiFetch } from "@/shared/api/fetcher";
import { paginationSchema } from "@/shared/api/schema";
import { useToast } from "@/shared/lib/use-toast";

import { tagSchema } from "./schema";

import type {
  TCreateTag,
  TTagQuery,
  TUpdateTag,
  TDeleteTag,
  TTag,
} from "./schema";
import type {
  TGetResponseContent,
  TPostResponseContent,
} from "@/shared/api/types";

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
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["tags", "all"],
    queryFn: async () => {
      const response =
        await apiFetch<TGetResponseContent<TTag[]>>("/admin/tag");

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
      const response = await apiFetch<TGetResponseContent<TTag[]>>(
        "/admin/tag",
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: TCreateTag) => {
      const response = await apiFetch<TPostResponseContent>("/admin/tag", {
        method: "POST",
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: TUpdateTag) => {
      const response = await apiFetch<TPostResponseContent>("/admin/tag", {
        method: "PUT",
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: TDeleteTag) => {
      const response = await apiFetch<TPostResponseContent>("/admin/tag", {
        method: "DELETE",
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
