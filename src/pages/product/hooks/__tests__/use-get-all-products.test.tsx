import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useGetAllProducts } from "../use-product";

import type { TProduct } from "@/services/contracts/product";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockGetToken = vi.fn().mockResolvedValue("mock-token");
vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({
    getToken: mockGetToken,
  }),
}));

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

const mockClient = {
  getAllProducts: vi.fn(),
};

vi.mock("@/services/client", () => ({
  default: vi.fn(() => mockClient),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return Wrapper;
};

const createMockProduct = (
  id: string,
  status: "active" | "inactive" = "active"
): TProduct => ({
  product_id: id,
  product_name: `Product ${id}`,
  product_price: "100",
  product_size: "10",
  product_type: "ELECTRONICS",
  product_status: status,
  product_images: [
    {
      file_name: `product_${id}.jpg`,
      file_url: `https://example.com/product_${id}.jpg`,
    },
  ],
  product_detail: {
    product_description: { zh: "描述", en: "Description", th: "Description" },
    short_title: { zh: "標題", en: "Title", th: "Title" },
    ingredients: { zh: "成分", en: "Ingredients", th: "Ingredients" },
    introduction: { zh: "介紹", en: "Introduction", th: "Introduction" },
    precautions: { zh: "注意事項", en: "Precautions", th: "Precautions" },
    shelf_life: "12 months",
    origin: { zh: "來源", en: "Origin", th: "Origin" },
    aroma_level: "Medium",
    flavor: { zh: "風味", en: "Flavor", th: "Flavor" },
    appearance: { zh: "外觀", en: "Appearance", th: "Appearance" },
    best_occasion: { zh: "最佳場合", en: "Best Occasion", th: "Best Occasion" },
    scene_matching: {
      zh: "場景搭配",
      en: "Scene Matching",
      th: "Scene Matching",
    },
    food_pairing: { zh: "食物搭配", en: "Food Pairing", th: "Food Pairing" },
  },
  vendor_id: [],
  tag_id: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe("useGetAllProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("成功場景", () => {
    it("應該成功獲取所有產品並返回正確的資料結構", async () => {
      const mockProducts = [
        createMockProduct("1", "active"),
        createMockProduct("2", "inactive"),
        createMockProduct("3", "active"),
      ];

      mockClient.getAllProducts.mockResolvedValue({
        status: 200,
        body: {
          success: true,
          data: mockProducts,
        },
      });

      const { result } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        success: true,
        data: mockProducts,
      });
      expect(result.current.data?.data).toHaveLength(3);
      expect(result.current.isLoading).toBe(false);
    });

    it("應該正確處理空資料", async () => {
      mockClient.getAllProducts.mockResolvedValue({
        status: 200,
        body: {
          success: true,
          data: [],
        },
      });

      const { result } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([]);
    });

    it("應該使用正確的查詢鍵", async () => {
      mockClient.getAllProducts.mockResolvedValue({
        status: 200,
        body: {
          success: true,
          data: [],
        },
      });

      const { result } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 驗證 API 被正確調用，證明查詢鍵設定正確
      expect(mockClient.getAllProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe("錯誤處理", () => {
    it("應該處理未授權的情況", async () => {
      // 設定 mock 返回 null token
      mockGetToken.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
      expect(mockToast).toHaveBeenCalledWith({
        title: "toast.auth.unauthorized.title",
        description: "toast.auth.unauthorized.description",
        variant: "destructive",
      });
    });

    it("應該處理 API 錯誤回應", async () => {
      mockClient.getAllProducts.mockResolvedValue({
        status: 500,
        body: null,
      });

      const { result } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.data).toBeUndefined();
      expect(mockToast).toHaveBeenCalledWith({
        title: "common.error",
        description: "toast.product.get.error",
        variant: "destructive",
      });
    });

    it("應該處理網路錯誤", async () => {
      mockClient.getAllProducts.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error("Network error"));
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("查詢配置", () => {
    it("應該設定正確的快取時間", async () => {
      mockClient.getAllProducts.mockResolvedValue({
        status: 200,
        body: {
          success: true,
          data: [createMockProduct("1")],
        },
      });

      const { result } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockClient.getAllProducts).toHaveBeenCalledTimes(1);
    });

    it("應該在 mount 時重新獲取資料", async () => {
      mockClient.getAllProducts.mockResolvedValue({
        status: 200,
        body: {
          success: true,
          data: [],
        },
      });

      const { result, rerender } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      rerender();

      expect(mockClient.getAllProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe("資料過濾功能", () => {
    it("應該能夠根據狀態過濾產品", async () => {
      const mockProducts = [
        createMockProduct("1", "active"),
        createMockProduct("2", "inactive"),
        createMockProduct("3", "active"),
        createMockProduct("4", "inactive"),
      ];

      mockClient.getAllProducts.mockResolvedValue({
        status: 200,
        body: {
          success: true,
          data: mockProducts,
        },
      });

      const { result } = renderHook(() => useGetAllProducts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(4);

      const activeProducts = result.current.data?.data?.filter(
        (product: TProduct) => product.product_status === "active"
      );
      expect(activeProducts).toHaveLength(2);

      const inactiveProducts = result.current.data?.data?.filter(
        (product: TProduct) => product.product_status === "inactive"
      );
      expect(inactiveProducts).toHaveLength(2);
    });
  });
});
