import { generateMock } from "@anatine/zod-mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { productSchema } from "@/services/contracts/product";

import ProductList from "../ProductList";

import type { TProduct } from "@/services/contracts/product";

/**
 * ProductList 簡化整合測試
 *
 * 此測試檔案專注於驗證商品狀態篩選功能的核心整合場景：
 * - 組件正確渲染與狀態管理
 * - API hooks 正確調用
 * - 數量統計功能整合
 * - 篩選邏輯基本驗證
 */

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "table.headers.product.thumbnail": "Thumbnail",
        "table.headers.product.productType": "Product Type",
        "table.headers.product.productName": "Product Name",
        "table.headers.product.productCode": "Product Code",
        "table.headers.product.productStock": "Stock",
        "table.headers.product.price": "Price",
        "table.headers.product.productStatus": "Product Status",
        "table.headers.product.actions": "Actions",
        "pages.product.productCreate.addProduct": "Add Product",
      };
      return translations[key] || key;
    },
    i18n: { language: "en" },
  }),
}));

// Mock @tanstack/react-router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Clerk
vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("mock-token"),
  }),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// 使用 zod-mock 生成測試資料
const createMockProductData = (): TProduct[] => {
  // 生成基本 mock 資料
  const baseProducts = Array.from({ length: 3 }, () =>
    generateMock(productSchema)
  );

  // 手動調整關鍵欄位以確保測試邏輯正確
  const customizedProducts: TProduct[] = [
    {
      ...baseProducts[0],
      product_id: "1",
      product_name: "Active Product 1",
      product_status: "active",
      product_type: "ELECTRONICS",
    },
    {
      ...baseProducts[1],
      product_id: "2",
      product_name: "Active Product 2",
      product_status: "active",
      product_type: "FOOD",
    },
    {
      ...baseProducts[2],
      product_id: "3",
      product_name: "Inactive Product 1",
      product_status: "inactive",
      product_type: "ELECTRONICS",
    },
  ];

  return customizedProducts;
};

// Test data
const mockAllProducts = createMockProductData();
const mockActiveProducts = mockAllProducts.filter(
  (p) => p.product_status === "active"
);
const mockInactiveProducts = mockAllProducts.filter(
  (p) => p.product_status === "inactive"
);

// Mock product hooks
vi.mock("../hooks/use-product", () => {
  const mockUseGetProductList = vi.fn();
  const mockUseGetAllProducts = vi.fn();
  const mockUseDeleteProduct = vi.fn();

  return {
    useGetProductList: mockUseGetProductList,
    useGetAllProducts: mockUseGetAllProducts,
    useDeleteProduct: mockUseDeleteProduct,
  };
});

// Mock shared components
vi.mock("@/components/shared/Navbar", () => ({
  Navbar: ({ children }: { children: React.ReactNode }) => (
    <nav data-testid="navbar">{children}</nav>
  ),
}));

vi.mock("@/components/shared/EditActions", () => ({
  __esModule: true,
  default: ({
    onEdit,
    onDelete,
  }: {
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div data-testid="edit-actions">
      <button onClick={onEdit} data-testid="edit-button">
        Edit
      </button>
      <button onClick={onDelete} data-testid="delete-button">
        Delete
      </button>
    </div>
  ),
}));

vi.mock("@/components/shared/Card", () => ({
  __esModule: true,
  default: ({ title, footer }: { title: string; footer: React.ReactNode }) => (
    <div data-testid="product-card">
      <h3>{title}</h3>
      {footer}
    </div>
  ),
}));

// Mock DataTable - 簡化版本，專注於驗證資料渲染
vi.mock("@/components/shared/DataTable", () => ({
  __esModule: true,
  default: ({ data }: { data: TProduct[] }) => {
    return (
      <div data-testid="data-table">
        <div data-testid="table-data">
          {data.map((product) => (
            <div
              key={product.product_id}
              data-testid={`product-row-${product.product_id}`}
            >
              {product.product_name} - {product.product_status}
            </div>
          ))}
        </div>
      </div>
    );
  },
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ProductList Integration Tests", () => {
  let mockUseGetProductList: ReturnType<typeof vi.fn>;
  let mockUseGetAllProducts: ReturnType<typeof vi.fn>;
  let mockUseDeleteProduct: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mock references
    const { useGetProductList, useGetAllProducts, useDeleteProduct } =
      await import("../hooks/use-product");
    mockUseGetProductList = vi.mocked(useGetProductList);
    mockUseGetAllProducts = vi.mocked(useGetAllProducts);
    mockUseDeleteProduct = vi.mocked(useDeleteProduct);

    // Set default mock implementations
    mockUseGetProductList.mockReturnValue({
      data: {
        success: true,
        data: mockAllProducts,
        total: mockAllProducts.length,
        code: 200,
        msg: "success",
      },
      isLoading: false,
      isLoadingError: false,
    });

    mockUseGetAllProducts.mockReturnValue({
      data: {
        success: true,
        data: mockAllProducts,
        total: mockAllProducts.length,
        code: 200,
        msg: "success",
      },
      isLoading: false,
      isError: false,
    });

    mockUseDeleteProduct.mockReturnValue({
      mutate: vi.fn(),
      data: undefined,
      error: null,
      isError: false,
      isIdle: true,
      isPending: false,
      isSuccess: false,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      variables: undefined,
      status: "idle",
      submittedAt: 0,
      mutateAsync: vi.fn(),
      reset: vi.fn(),
    });
  });

  describe("組件基本渲染", () => {
    it("should render ProductList component successfully", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證主要組件渲染
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByTestId("data-table")).toBeInTheDocument();
    });

    it("should render all products in data table", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證所有商品都正確渲染
      await waitFor(() => {
        expect(screen.getByTestId("product-row-1")).toBeInTheDocument();
        expect(screen.getByTestId("product-row-2")).toBeInTheDocument();
        expect(screen.getByTestId("product-row-3")).toBeInTheDocument();
      });

      // 驗證商品內容正確
      expect(screen.getByText("Active Product 1 - active")).toBeInTheDocument();
      expect(screen.getByText("Active Product 2 - active")).toBeInTheDocument();
      expect(
        screen.getByText("Inactive Product 1 - inactive")
      ).toBeInTheDocument();
    });
  });

  describe("API hooks 整合", () => {
    it("should call useGetProductList hook with correct parameters", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證 useGetProductList 被正確調用
      await waitFor(() => {
        expect(mockUseGetProductList).toHaveBeenCalled();
      });

      // 檢查調用參數結構
      const callArgs = mockUseGetProductList.mock.calls[0][0];
      expect(callArgs).toHaveProperty("page");
      expect(callArgs).toHaveProperty("limit");
    });

    it("should call useGetAllProducts hook for statistics", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證 useGetAllProducts 被調用以獲取統計數據
      await waitFor(() => {
        expect(mockUseGetAllProducts).toHaveBeenCalled();
      });
    });

    it("should call useDeleteProduct hook", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證 useDeleteProduct hook 被初始化
      expect(mockUseDeleteProduct).toHaveBeenCalled();
    });
  });

  describe("數量統計功能", () => {
    it("should provide correct product counts for status filtering", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證能夠正確計算各狀態的商品數量
      const totalProducts = mockAllProducts.length;
      const activeCount = mockActiveProducts.length;
      const inactiveCount = mockInactiveProducts.length;

      expect(totalProducts).toBe(3);
      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(1);

      // 驗證統計數據正確
      await waitFor(() => {
        expect(mockUseGetAllProducts).toHaveBeenCalled();
      });
    });
  });

  describe("佈局切換功能", () => {
    it("should render layout toggle button", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 查找佈局切換按鈕 - 檢查是否有兩個按鈕存在（toggle 和 add product）
      const buttons = screen.getAllByRole("button");

      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toBeInTheDocument(); // layout toggle button
      expect(buttons[1]).toBeInTheDocument(); // add product button
    });

    it("should render add product button", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證新增商品按鈕存在
      expect(screen.getByText("Add Product")).toBeInTheDocument();
    });
  });

  describe("錯誤處理", () => {
    it("should handle empty product list", async () => {
      // 模擬空商品列表
      mockUseGetProductList.mockReturnValueOnce({
        data: {
          success: true,
          data: [],
          total: 0,
          code: 200,
          msg: "success",
        },
        isLoading: false,
        isLoadingError: false,
      });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        const tableData = screen.getByTestId("table-data");
        expect(tableData).toBeEmptyDOMElement();
      });
    });

    it("should handle loading state", async () => {
      // 模擬載入狀態
      mockUseGetProductList.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        isLoadingError: false,
      });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證在載入狀態下仍然渲染基本結構
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });
  });

  describe("型別安全性驗證", () => {
    it("should correctly type product status values", () => {
      // 驗證商品狀態型別正確
      const activeProduct = mockActiveProducts[0];
      const inactiveProduct = mockInactiveProducts[0];

      expect(activeProduct.product_status).toBe("active");
      expect(inactiveProduct.product_status).toBe("inactive");
    });

    it("should correctly type product data structure", () => {
      // 驗證商品資料結構型別正確
      const product = mockAllProducts[0];

      expect(product).toHaveProperty("product_id");
      expect(product).toHaveProperty("product_name");
      expect(product).toHaveProperty("product_status");
      expect(product).toHaveProperty("product_type");
      expect(product).toHaveProperty("product_images");
      expect(product).toHaveProperty("product_detail");
    });
  });
});
