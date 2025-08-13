import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { isEmpty } from "ramda";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import { useValidationMessage } from "@/lib/gen-validate-message";
import apiClient from "@/services/client";
import {
  articleContract,
  articleFormSchema,
} from "@/services/contracts/article";
import { userContract } from "@/services/contracts/user";
import { paginationSchema } from "@/services/types/schema";

import type { TArticle, TArticleForm } from "@/services/contracts/article";
import type { TPagination, TSortOrder } from "@/services/types/schema";

type TArticleListParams = TPagination & {
  sort_by?: string;
  order?: TSortOrder;
};

export const useGetArticleList = (params: Partial<TArticleListParams>) => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  const pageQuery = useMemo(() => {
    if (isEmpty(params)) return undefined;
    return {
      page: params.page ? params.page : paginationSchema.parse({}).page,
      limit: params.limit ? params.limit : paginationSchema.parse({}).limit,
      ...(params.sort_by && { sort_by: params.sort_by }),
      ...(params.order && { order: params.order }),
    };
  }, [params]);

  const queryKey = useMemo(() => {
    const page = params.page ?? paginationSchema.parse({}).page;
    const limit = params.limit ?? paginationSchema.parse({}).limit;
    return ["articleList", page, limit, params.sort_by, params.order];
  }, [params.page, params.limit, params.sort_by, params.order]);

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

      const client = apiClient(articleContract, token);
      const response = await client.getArticles({
        query: pageQuery ?? {},
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.article.get.listError"),
          variant: "destructive",
        });
        return undefined;
      }

      return {
        data: response.body.data || [],
        total: response.body.total,
      };
    },
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
};

export const useGetArticle = (id: string) => {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["getArticle", id],
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

      const client = apiClient(articleContract, token);

      const response = await client.getArticle({
        query: { article_id: id },
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.article.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body.data?.[0];
    },
    enabled: !!id,
  });
};

export const useCreateArticle = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: TArticleFormData) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        throw new Error("No authentication token");
      }

      // 先調用 getUserProfile API 獲取最新用戶資料
      const userClient = apiClient(userContract, token);
      const userResponse = await userClient.getUserProfile();

      if (userResponse.status !== 200) {
        toast({
          title: t("common.error"),
          description: "獲取用戶資訊失敗，請重新登入",
          variant: "destructive",
        });
        throw new Error("Failed to get user profile");
      }

      // API 回應結構：用戶資料直接在 body 中，不在 data 中
      const currentUser = userResponse.body;

      if (!currentUser?.user_id) {
        toast({
          title: t("common.error"),
          description: "無法獲取用戶資訊，請重新登入",
          variant: "destructive",
        });
        throw new Error("No user data available");
      }

      const client = apiClient(articleContract, token);
      const response = await client.createArticle({
        body: {
          ...data,
          user_id: currentUser.user_id, // 使用工作人員表的 staff_id
          nick_name: `${currentUser.first_name}${currentUser.last_name}`, // 組合 first_name + last_name
        } as TArticleForm,
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.article.create.error"),
          variant: "destructive",
        });
        throw new Error(`Create article failed: ${response.status}`);
      }

      return response.body;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["articleList"] });
      toast({
        title: t("common.success"),
        description: t("toast.article.create.success"),
        variant: "success",
      });
      navigate({
        to: "/articles",
      });
    },
    onError: (error) => {
      if (error) {
        toast({
          title: t("common.error"),
          description: t("toast.article.create.error"),
          variant: "destructive",
        });
      }
    },
  });
};

export const useUpdateArticle = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: TArticleFormData & { article_id: string }) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        throw new Error("No authentication token");
      }

      // 先調用 getUserProfile API 獲取最新用戶資料
      const userClient = apiClient(userContract, token);
      const userResponse = await userClient.getUserProfile();

      if (userResponse.status !== 200) {
        toast({
          title: t("common.error"),
          description: "獲取用戶資訊失敗，請重新登入",
          variant: "destructive",
        });
        throw new Error("Failed to get user profile");
      }

      // API 回應結構：用戶資料直接在 body 中，不在 data 中
      const currentUser = userResponse.body;

      if (!currentUser?.user_id) {
        toast({
          title: t("common.error"),
          description: "無法獲取用戶資訊，請重新登入",
          variant: "destructive",
        });
        throw new Error("No user data available");
      }

      const client = apiClient(articleContract, token);
      const response = await client.updateArticle({
        body: {
          ...data,
          user_id: currentUser.user_id, // 使用工作人員表的 staff_id
          nick_name: `${currentUser.first_name}${currentUser.last_name}`, // 組合 first_name + last_name
        } as TArticle,
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.article.update.error"),
          variant: "destructive",
        });
        throw new Error(`Update article failed: ${response.status}`);
      }

      return response.body;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["articleList"] });
      await queryClient.invalidateQueries({ queryKey: ["getArticle"] });

      toast({
        title: t("common.success"),
        description: t("toast.article.update.success"),
        variant: "success",
      });
      navigate({
        to: "/articles",
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

export const useDeleteArticle = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: TArticle["article_id"]) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      const client = apiClient(articleContract, token);
      const response = await client.deleteArticle({
        body: { article_id: id },
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.article.delete.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articleList"] });
      toast({
        title: t("common.success"),
        description: t("toast.article.delete.success"),
        variant: "success",
      });
    },
  });
};

export const useCreateArticleSchema = () => {
  const validationMessage = useValidationMessage();

  const createArticleSchema = articleFormSchema
    .omit({
      user_id: true,
      nick_name: true,
    })
    .extend({
      title: z.string().min(1, {
        message: validationMessage.getRequiredMessage("pages.article.title"),
      }),
      image_url: z
        .object({
          file_name: z.string(),
          file_url: z.string(),
        })
        .optional()
        .refine((data) => data && data.file_name && data.file_url, {
          message: validationMessage.getRequiredMessage(
            "pages.article.coverImage"
          ),
        }),
      // content_html 不在這裡驗證，在提交時手動驗證
      content_html: z.string().optional(),
    });

  return createArticleSchema;
};

export type TArticleFormData = z.infer<
  ReturnType<typeof useCreateArticleSchema>
>;
