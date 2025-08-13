import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import { useValidationMessage } from "@/lib/gen-validate-message";
import apiClient from "@/services/client";
import { generateProductData } from "@/services/contracts/mock-data";
import {
  productContract,
  productSchema,
  productTypeEnums,
} from "@/services/contracts/product";
import {
  activeStatusEnums,
  imageResponseSchema,
  langSchema,
  paginationSchema,
} from "@/services/types/schema";

import type { TransKey } from "@/constants/locales";
import type { TProductQuery, TProduct } from "@/services/contracts/product";

export const useCreateProduct = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<TProduct, "product_id">) => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        return undefined;
      }

      // const client = apiClient(productContract, token);
      // const response = await client.createProduct({
      //   body: data,
      // });

      // if (response.status !== 200) {
      //   toast({
      //     title: t("common.error"),
      //     description: t("toast.product.create.error"),
      //     variant: "destructive",
      //   });
      //   return undefined;
      // }

      // return response.body;

      const mockData = generateProductData();

      return mockData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productList"] });
      toast({
        title: t("common.success"),
        description: t("toast.product.create.success"),
        variant: "success",
      });
      navigate({ to: "/products" });
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

export const useUpdateProduct = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: TProduct) => {
      const token = await getToken();
      if (!token) {
        return toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
      }

      const client = apiClient(productContract, token);
      const response = await client.updateProduct({
        body: product,
      });

      if (response.status !== 200) {
        return toast({
          title: t("common.error"),
          description: t("toast.product.update.error"),
          variant: "destructive",
        });
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productList"] });
      toast({
        title: t("common.success"),
        description: t("toast.product.update.success"),
        variant: "success",
      });
      navigate({ to: "/products" });
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

export const useGetProductList = (query: Partial<TProductQuery>) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const pageQuery = useMemo(() => {
    const hasContent =
      query.page ||
      query.limit ||
      query.sort_by ||
      query.order ||
      query.product_status;
    if (!hasContent) return undefined;

    return {
      page: query.page ? query.page : paginationSchema.parse({}).page,
      limit: query.limit ? query.limit : paginationSchema.parse({}).limit,
      ...(query.sort_by && { sort_by: query.sort_by }),
      ...(query.order && { order: query.order }),
      ...(query.product_status && { product_status: query.product_status }),
    };
  }, [query]);

  const queryKey = useMemo(() => {
    return [
      "productList",
      query.page ?? paginationSchema.parse({}).page,
      query.limit ?? paginationSchema.parse({}).limit,
      query.sort_by,
      query.order,
      query.product_status,
    ];
  }, [
    query.page,
    query.limit,
    query.sort_by,
    query.order,
    query.product_status,
  ]);

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

      const client = apiClient(productContract, token);
      const response = await client.getProducts({
        query: pageQuery ?? {},
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.product.get.error"),
          variant: "destructive",
        });
        return undefined;
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

export const useGetProduct = (product_id: string) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["product", product_id],
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

      const client = apiClient(productContract, token);
      const response = await client.getProduct({
        query: {
          product_id,
        },
      });

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.product.get.error"),
          variant: "destructive",
        });
        return undefined;
      }

      return response.body.data;
    },
    enabled: !!product_id,
  });
};

export const useDeleteProduct = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product_id: TProduct["product_id"]) => {
      const token = await getToken();
      if (!token) {
        return toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
      }

      const client = apiClient(productContract, token);
      const response = await client.deleteProduct({
        body: { product_id },
      });

      if (response.status !== 200) {
        return toast({
          title: t("common.error"),
          description: t("toast.product.delete.error"),
          variant: "destructive",
        });
      }

      return response.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productList"] });
      toast({
        title: t("common.success"),
        description: t("toast.product.delete.success"),
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

export const useProductSchema = (mode: "create" | "edit" = "create") => {
  const getMessage = useValidationMessage();

  return useMemo(() => {
    const createLangSchema = (
      fieldPath: Extract<TransKey, `pages.product.productCreate.${string}`>
    ) =>
      langSchema.extend({
        zh: z.string().min(1, {
          message: getMessage.getRequiredLangMessage(fieldPath),
        }),
        en: z.string().min(1, {
          message: getMessage.getRequiredLangMessage(fieldPath),
        }),
        th: z.string().min(1, {
          message: getMessage.getRequiredLangMessage(fieldPath),
        }),
      });

    const editLangSchema = () =>
      langSchema.extend({
        zh: z.string().optional(),
        en: z.string().optional(),
        th: z.string().optional(),
      });

    const baseValidation = {
      product_price: z.coerce.number().min(1, {
        message: getMessage.getMinNumberMessage(
          "pages.product.productCreate.price",
          0
        ),
      }),
      product_size: z.coerce.number().min(1, {
        message: getMessage.getMinNumberMessage(
          "pages.product.productCreate.productSize",
          0
        ),
      }),
      product_status: activeStatusEnums.optional(),
      product_type: productTypeEnums.optional(),
      supplier_id: z.array(z.string()).optional(),
      tag_id: z.array(z.string()).optional(),
    };

    const createModeValidation = {
      ...baseValidation,
      product_name: z.string().nonempty({
        message: getMessage.getRequiredMessage(
          "pages.product.productCreate.productName"
        ),
      }),
      product_images: z.array(imageResponseSchema).min(1, {
        message: getMessage.getMinImagesMessage(),
      }),
      product_detail: z.object({
        product_description: createLangSchema(
          "pages.product.productCreate.productDescription"
        ),
        short_title: createLangSchema("pages.product.productCreate.shortTitle"),
        ingredients: createLangSchema(
          "pages.product.productCreate.ingredients"
        ),
        introduction: createLangSchema(
          "pages.product.productCreate.introduction"
        ),
        precautions: createLangSchema(
          "pages.product.productCreate.precautions"
        ),
        shelf_life: z.string().min(1, {
          message: getMessage.getRequiredMessage(
            "pages.product.productCreate.shelfLife"
          ),
        }),
        origin: createLangSchema("pages.product.productCreate.origin"),
        aroma_level: z.string().min(1, {
          message: getMessage.getRequiredMessage(
            "pages.product.productCreate.aromaLevel"
          ),
        }),
        flavor: createLangSchema("pages.product.productCreate.flavor"),
        appearance: createLangSchema("pages.product.productCreate.appearance"),
        best_occasion: createLangSchema(
          "pages.product.productCreate.bestOccasion"
        ),
        scene_matching: createLangSchema(
          "pages.product.productCreate.sceneMatching"
        ),
        food_pairing: createLangSchema(
          "pages.product.productCreate.foodPairing"
        ),
      }),
    };

    const editModeValidation = {
      ...baseValidation,
      product_name: z.string().optional(),
      product_images: z.array(imageResponseSchema).optional(),
      product_detail: z.object({
        product_description: editLangSchema(),
        short_title: editLangSchema(),
        ingredients: editLangSchema(),
        introduction: editLangSchema(),
        precautions: editLangSchema(),
        shelf_life: z.string().optional(),
        origin: editLangSchema(),
        aroma_level: z.string().optional(),
        flavor: editLangSchema(),
        appearance: editLangSchema(),
        best_occasion: editLangSchema(),
        scene_matching: editLangSchema(),
        food_pairing: editLangSchema(),
      }),
    };

    const productFormSchema = productSchema
      .omit({ product_id: true, created_at: true, updated_at: true })
      .extend(mode === "create" ? createModeValidation : editModeValidation);

    return productFormSchema;
  }, [mode, getMessage]);
};

export const useCreateProductSchema = () => {
  return useProductSchema("create");
};

export type TProductForm = z.infer<ReturnType<typeof useCreateProductSchema>>;

export const useProductValidation = () => {
  const checkRequiredFieldsFilled = (
    formData: Partial<TProductForm>
  ): boolean => {
    const requiredFields = ["product_name", "product_price", "product_size"];

    const basicFieldsFilled = requiredFields.every((field) => {
      const value = formData[field as keyof TProductForm];
      return value !== undefined && value !== "" && value !== 0;
    });

    const hasImages = Boolean(
      formData.product_images && formData.product_images.length > 0
    );

    return basicFieldsFilled && hasImages;
  };

  const checkHasChanges = (
    currentData: Partial<TProductForm>,
    originalData: Partial<TProductForm>
  ): boolean => {
    const checkableFields: (keyof TProductForm)[] = [
      "product_name",
      "product_price",
      "product_size",
      "product_type",
      "product_status",
    ];

    return checkableFields.some((field) => {
      return currentData[field] !== originalData[field];
    });
  };

  return {
    checkRequiredFieldsFilled,
    checkHasChanges,
  };
};

export const useGetAllProducts = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["allProducts"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        toast({
          title: t("toast.auth.unauthorized.title"),
          description: t("toast.auth.unauthorized.description"),
          variant: "destructive",
        });
        throw new Error("Unauthorized");
      }

      const client = apiClient(productContract, token);
      const response = await client.getAllProducts();

      if (response.status !== 200) {
        toast({
          title: t("common.error"),
          description: t("toast.product.get.error"),
          variant: "destructive",
        });
        throw new Error("API Error");
      }

      return response.body;
    },
    gcTime: 1000 * 60 * 10,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
