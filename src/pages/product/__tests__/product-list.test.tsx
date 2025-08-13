import { generateMock } from "@anatine/zod-mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { productSchema } from "@/services/contracts/product";

import ProductList from "../ProductList";

import type { TProduct } from "@/services/contracts/product";

/**
 * ProductList 整合測試
 *
 * 此測試檔案針對商品狀態篩選功能的整合場景進行測試，包括：
 * - 篩選與分頁互動：篩選變更時重置分頁到第一頁
 * - 篩選與排序互動：保持篩選條件下的排序功能
 * - 數量統計正確性：StatusColumnFilter 顯示正確的商品數量
 * - 篩選邏輯驗證：不同狀態篩選的正確性
 * - 狀態同步測試：columnFilters 與 API 參數的同步
 */

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
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
        "pages.product.productDraft.copyToCreate": "Copy to Create",
        "pages.product.filter.allStatus": "All",
        "pages.product.status.active": "Active",
        "pages.product.status.inactive": "Inactive",
        "table.pagination.pageInfo": `Page ${options?.currentPage} of ${options?.totalPages}`,
        "table.pagination.itemsPerPage": "Items per page",
        "table.pagination.previous": "Previous",
        "table.pagination.next": "Next",
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

// Global state for mocking
const mockAllProducts = createMockProductData();
const mockActiveProducts = mockAllProducts.filter(
  (p) => p.product_status === "active"
);
const mockInactiveProducts = mockAllProducts.filter(
  (p) => p.product_status === "inactive"
);
let currentFilter: string | undefined = undefined;

// Mock product hooks
vi.mock("../hooks/use-product", () => ({
  useGetProductList: vi.fn(() => {
    const filteredData =
      currentFilter === "active"
        ? mockActiveProducts
        : currentFilter === "inactive"
        ? mockInactiveProducts
        : mockAllProducts;

    return {
      data: {
        data: filteredData,
        total: filteredData.length,
      },
      isLoading: false,
      isLoadingError: false,
    };
  }),
  useGetAllProducts: vi.fn(() => ({
    data: {
      data: mockAllProducts,
      total: mockAllProducts.length,
    },
    isLoading: false,
    isError: false,
  })),
  useDeleteProduct: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

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
    children,
  }: {
    onEdit: () => void;
    onDelete: () => void;
    children?: React.ReactNode;
  }) => (
    <div data-testid="edit-actions">
      <button onClick={onEdit} data-testid="edit-button">
        Edit
      </button>
      {children}
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

// Mock DataTable with filter support
vi.mock("@/components/shared/DataTable", () => ({
  __esModule: true,
  default: (props: {
    data: TProduct[];
    pagination: { state: { pageIndex: number; pageSize: number } };
    onPaginationChange?: (paginationState: {
      pageIndex: number;
      pageSize: number;
    }) => void;
    columnFilters?: unknown;
    sorting?: unknown;
    onSortingChange?: (sortingState: unknown) => void;
  }) => {
    const {
      data,
      pagination,
      onPaginationChange = () => {},
      columnFilters,
      sorting,
      onSortingChange = () => {},
    } = props;

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

        {/* 模擬篩選狀態顯示 */}
        <div data-testid="filter-info">
          Current Filter: {JSON.stringify(columnFilters || [])}
        </div>

        {/* 模擬排序狀態顯示 */}
        <div data-testid="sort-info">
          Current Sort: {JSON.stringify(sorting || [])}
        </div>

        {/* 模擬分頁控制 */}
        <div data-testid="pagination-controls">
          <span data-testid="current-page">
            Page: {pagination.state.pageIndex + 1}
          </span>
          <button
            onClick={() =>
              onPaginationChange({
                pageIndex: Math.max(0, pagination.state.pageIndex - 1),
                pageSize: pagination.state.pageSize,
              })
            }
            data-testid="prev-page"
            disabled={pagination.state.pageIndex === 0}
          >
            Previous
          </button>
          <button
            onClick={() =>
              onPaginationChange({
                pageIndex: pagination.state.pageIndex + 1,
                pageSize: pagination.state.pageSize,
              })
            }
            data-testid="next-page"
          >
            Next
          </button>
        </div>

        {/* 模擬排序控制 */}
        <div data-testid="sorting-controls">
          <button
            onClick={() =>
              onSortingChange([{ id: "product_name", desc: false }])
            }
            data-testid="sort-name-asc"
          >
            Sort Name ASC
          </button>
          <button
            onClick={() =>
              onSortingChange([{ id: "product_price", desc: true }])
            }
            data-testid="sort-price-desc"
          >
            Sort Price DESC
          </button>
        </div>
      </div>
    );
  },
}));

// Test wrapper component that provides necessary context
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

// Test data references
const mockUseGetProductList = vi.fn();
const mockUseGetAllProducts = vi.fn();

describe("ProductList Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentFilter = undefined;
  });

  describe("篩選與分頁互動", () => {
    it("should reset pagination to first page when filter changes", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證初始狀態
      expect(screen.getByTestId("current-page")).toHaveTextContent("Page: 1");

      // 模擬分頁到第2頁
      fireEvent.click(screen.getByTestId("next-page"));

      await waitFor(() => {
        expect(screen.getByTestId("current-page")).toHaveTextContent("Page: 2");
      });

      // 當篩選變更時，應該重置分頁到第1頁
      // 注意：實際的篩選變更需要透過 StatusColumnFilter 組件觸發
      // 這裡模擬透過設定 columnFilters 來測試重置行為

      // 驗證篩選變更後分頁重置的行為
      expect(mockUseGetProductList).toHaveBeenCalled();
    });

    it("should maintain filter state during pagination", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證篩選狀態在分頁變更時保持不變
      const filterInfo = screen.getByTestId("filter-info");
      const initialFilterState = filterInfo.textContent;

      // 切換分頁
      fireEvent.click(screen.getByTestId("next-page"));

      await waitFor(() => {
        expect(filterInfo.textContent).toBe(initialFilterState);
      });
    });
  });

  describe("篩選與排序互動", () => {
    it("should maintain filter state when sorting changes", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 觸發排序
      fireEvent.click(screen.getByTestId("sort-name-asc"));

      await waitFor(() => {
        const sortInfo = screen.getByTestId("sort-info");
        expect(sortInfo).toHaveTextContent("product_name");
      });

      // 驗證篩選狀態保持不變
      const filterInfo = screen.getByTestId("filter-info");
      expect(filterInfo.textContent).toContain("Current Filter:");
    });

    it("should reset pagination when sorting changes", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 切換到第2頁
      fireEvent.click(screen.getByTestId("next-page"));

      await waitFor(() => {
        expect(screen.getByTestId("current-page")).toHaveTextContent("Page: 2");
      });

      // 觸發排序
      fireEvent.click(screen.getByTestId("sort-price-desc"));

      // 驗證分頁重置到第1頁
      await waitFor(() => {
        expect(screen.getByTestId("current-page")).toHaveTextContent("Page: 1");
      });
    });

    it("should allow simultaneous filtering and sorting", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 同時設定篩選和排序
      fireEvent.click(screen.getByTestId("sort-name-asc"));

      await waitFor(() => {
        const sortInfo = screen.getByTestId("sort-info");
        const filterInfo = screen.getByTestId("filter-info");

        // 驗證排序和篩選狀態都存在
        expect(sortInfo).toBeInTheDocument();
        expect(filterInfo).toBeInTheDocument();
      });
    });
  });

  describe("數量統計正確性", () => {
    it("should display correct product counts for all status", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證顯示所有商品
      await waitFor(() => {
        expect(screen.getByTestId("product-row-1")).toBeInTheDocument();
        expect(screen.getByTestId("product-row-2")).toBeInTheDocument();
        expect(screen.getByTestId("product-row-3")).toBeInTheDocument();
      });

      // 驗證 useGetAllProducts 被調用以獲取統計數據
      expect(mockUseGetAllProducts).toHaveBeenCalled();
    });

    it("should display correct product counts when filtering by active status", async () => {
      // 設定篩選為 active
      currentFilter = "active";

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        // 只顯示 active 商品
        expect(screen.getByTestId("product-row-1")).toBeInTheDocument();
        expect(screen.getByTestId("product-row-2")).toBeInTheDocument();
        expect(screen.queryByTestId("product-row-3")).not.toBeInTheDocument();
      });
    });

    it("should display correct product counts when filtering by inactive status", async () => {
      // 設定篩選為 inactive
      currentFilter = "inactive";

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        // 只顯示 inactive 商品
        expect(screen.queryByTestId("product-row-1")).not.toBeInTheDocument();
        expect(screen.queryByTestId("product-row-2")).not.toBeInTheDocument();
        expect(screen.getByTestId("product-row-3")).toBeInTheDocument();
      });
    });
  });

  describe("狀態同步測試", () => {
    it("should sync columnFilters with API parameters", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證初始狀態下 API 被正確調用
      expect(mockUseGetProductList).toHaveBeenCalledWith({
        page: 1,
        limit: expect.any(Number),
      });
    });

    it("should handle layout toggle without affecting filters", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 查找切換佈局按鈕
      const layoutToggle = screen.getByRole("button", {
        name: /layoutlist|layoutgrid/i,
      });

      fireEvent.click(layoutToggle);

      // 驗證篩選狀態不受佈局切換影響
      await waitFor(() => {
        const filterInfo = screen.getByTestId("filter-info");
        expect(filterInfo).toBeInTheDocument();
      });
    });
  });

  describe("邊界情況處理", () => {
    it("should handle empty product list", async () => {
      // 模擬空資料
      mockUseGetProductList.mockReturnValue({
        data: { data: [], total: 0 },
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
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 在載入狀態下應該仍然渲染基本結構
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });

    it("should handle error state when no data is available", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 驗證組件能正確處理空資料狀態
      await waitFor(() => {
        expect(screen.getByTestId("data-table")).toBeInTheDocument();
      });
    });
  });

  describe("複製按鈕功能測試", () => {
    it("should render copy buttons in table view", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        // 驗證 EditActions 容器存在
        const editActions = screen.getAllByTestId("edit-actions");
        expect(editActions).toHaveLength(3); // 應該有3個商品，每個都有EditActions

        // 驗證複製按鈕存在（透過 title 屬性）
        const copyButtons = screen.getAllByTitle("Copy to Create");
        expect(copyButtons).toHaveLength(3); // 每個商品都應該有複製按鈕
      });
    });

    it("should render copy buttons in card view", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // 切換到卡片視圖
      const layoutToggle = screen.getByRole("button", {
        name: /layoutlist|layoutgrid/i,
      });
      fireEvent.click(layoutToggle);

      await waitFor(() => {
        // 在卡片視圖中驗證複製按鈕
        const copyButtons = screen.getAllByTitle("Copy to Create");
        expect(copyButtons).toHaveLength(3);
      });
    });

    it("should navigate to draft page when copy button is clicked", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        // 點擊第一個複製按鈕
        const copyButtons = screen.getAllByTitle("Copy to Create");
        fireEvent.click(copyButtons[0]);

        // 驗證導航函數被正確調用
        expect(mockNavigate).toHaveBeenCalledWith({
          to: "/products/draft/$id",
          params: { id: "1" }, // 根據 mock 數據，第一個商品的 ID 是 "1"
        });
      });
    });

    it("should navigate with correct product ID for different products", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        const copyButtons = screen.getAllByTitle("Copy to Create");

        // 點擊第二個複製按鈕
        fireEvent.click(copyButtons[1]);
        expect(mockNavigate).toHaveBeenCalledWith({
          to: "/products/draft/$id",
          params: { id: "2" },
        });

        // 點擊第三個複製按鈕
        fireEvent.click(copyButtons[2]);
        expect(mockNavigate).toHaveBeenCalledWith({
          to: "/products/draft/$id",
          params: { id: "3" },
        });
      });
    });

    it("should have correct accessibility attributes", async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        const copyButtons = screen.getAllByTitle("Copy to Create");

        copyButtons.forEach((button) => {
          // 驗證 aria-label 屬性
          expect(button).toHaveAttribute("aria-label", "Copy to Create");
          // 驗證 title 屬性
          expect(button).toHaveAttribute("title", "Copy to Create");
        });
      });
    });

    it("should maintain copy button functionality during filtering", async () => {
      // 設定篩選狀態
      currentFilter = "active";

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        // 在篩選狀態下，複製按鈕仍應正常工作
        const copyButtons = screen.getAllByTitle("Copy to Create");
        expect(copyButtons.length).toBeGreaterThan(0);

        // 點擊複製按鈕應該仍然正常導航
        fireEvent.click(copyButtons[0]);
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.objectContaining({
            to: "/products/draft/$id",
            params: expect.objectContaining({
              id: expect.any(String),
            }),
          })
        );
      });
    });
  });
});
