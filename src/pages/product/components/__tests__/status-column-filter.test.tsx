import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StatusColumnFilter from "../StatusColumnFilter";

import type { TProduct } from "@/services/contracts/product";
import type { Column } from "@tanstack/react-table";

type ProductStatus = TProduct["product_status"];

// Mock useTranslation hook
vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(),
}));

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    "table.headers.product.productStatus": "Product Status",
    "pages.product.filter.allStatus": "All",
    "pages.product.status.active": "Active",
    "pages.product.status.inactive": "Inactive",
  };
  return translations[key] || key;
});

// Setup test environment mock for scrollIntoView
Object.defineProperty(Element.prototype, "scrollIntoView", {
  value: vi.fn(),
  writable: true,
});

describe("StatusColumnFilter", () => {
  let mockColumn: Column<TProduct, ProductStatus>;
  let mockSetFilterValue: ReturnType<typeof vi.fn>;
  let mockGetFilterValue: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup translation mock
    (useTranslation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      t: mockT,
    });

    // Setup mock column
    mockSetFilterValue = vi.fn();
    mockGetFilterValue = vi.fn();

    mockColumn = {
      setFilterValue: mockSetFilterValue,
      getFilterValue: mockGetFilterValue,
      id: "product_status",
    } as unknown as Column<TProduct, ProductStatus>;
  });

  describe("渲染測試", () => {
    it("應該正確渲染選單元素", () => {
      mockGetFilterValue.mockReturnValue(undefined);

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 檢查選單觸發器是否存在
      expect(screen.getByRole("combobox")).toBeInTheDocument();

      // 檢查標題是否正確顯示
      expect(screen.getByText("Product Status:")).toBeInTheDocument();
    });

    it("應該正確顯示當前篩選值", () => {
      mockGetFilterValue.mockReturnValue("active");

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 當有篩選值時，應該顯示對應的狀態
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("當沒有篩選值時應該顯示 'All'", () => {
      mockGetFilterValue.mockReturnValue(undefined);

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      expect(screen.getByText("All")).toBeInTheDocument();
    });
  });

  describe("選項顯示與數量測試", () => {
    it("打開選單時應該顯示所有選項及其數量", async () => {
      mockGetFilterValue.mockReturnValue(undefined);

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 點擊選單觸發器
      const trigger = screen.getByRole("combobox");
      fireEvent.click(trigger);

      // 等待選單項目出現
      await waitFor(() => {
        expect(screen.getByText("All (100)")).toBeInTheDocument();
        expect(screen.getByText("Active (70)")).toBeInTheDocument();
        expect(screen.getByText("Inactive (30)")).toBeInTheDocument();
      });
    });

    it("當沒有 statusCounts 時應該顯示選項但沒有數量", async () => {
      mockGetFilterValue.mockReturnValue(undefined);

      render(<StatusColumnFilter column={mockColumn} />);

      // 點擊選單觸發器
      const trigger = screen.getByRole("combobox");
      fireEvent.click(trigger);

      // 等待選單項目出現，使用 getAllByText 來處理多個相同文字
      await waitFor(() => {
        const allOptions = screen.getAllByText("All");
        const activeOptions = screen.getAllByText("Active");
        const inactiveOptions = screen.getAllByText("Inactive");

        expect(allOptions.length).toBeGreaterThan(0);
        expect(activeOptions.length).toBeGreaterThan(0);
        expect(inactiveOptions.length).toBeGreaterThan(0);
      });

      // 確認沒有數量顯示
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });
  });

  describe("篩選功能測試", () => {
    it("選擇 'All' 應該清除篩選", async () => {
      mockGetFilterValue.mockReturnValue("active");

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 點擊選單觸發器
      const trigger = screen.getByRole("combobox");
      fireEvent.click(trigger);

      // 選擇 "All" 選項
      await waitFor(() => {
        const allOption = screen.getByText("All (100)");
        fireEvent.click(allOption);
      });

      // 驗證 setFilterValue 被調用且參數為 undefined
      expect(mockSetFilterValue).toHaveBeenCalledWith(undefined);
    });

    it("選擇 'Active' 應該設置篩選為 'active'", async () => {
      mockGetFilterValue.mockReturnValue(undefined);

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 點擊選單觸發器
      const trigger = screen.getByRole("combobox");
      fireEvent.click(trigger);

      // 選擇 "Active" 選項
      await waitFor(() => {
        const activeOption = screen.getByText("Active (70)");
        fireEvent.click(activeOption);
      });

      // 驗證 setFilterValue 被調用且參數為 'active'
      expect(mockSetFilterValue).toHaveBeenCalledWith("active");
    });

    it("選擇 'Inactive' 應該設置篩選為 'inactive'", async () => {
      mockGetFilterValue.mockReturnValue(undefined);

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 點擊選單觸發器
      const trigger = screen.getByRole("combobox");
      fireEvent.click(trigger);

      // 選擇 "Inactive" 選項
      await waitFor(() => {
        const inactiveOption = screen.getByText("Inactive (30)");
        fireEvent.click(inactiveOption);
      });

      // 驗證 setFilterValue 被調用且參數為 'inactive'
      expect(mockSetFilterValue).toHaveBeenCalledWith("inactive");
    });
  });

  describe("i18n 多語言測試", () => {
    it("應該使用翻譯函數來顯示文字", () => {
      mockGetFilterValue.mockReturnValue(undefined);

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 驗證翻譯函數被正確調用
      expect(mockT).toHaveBeenCalledWith("table.headers.product.productStatus");
      expect(mockT).toHaveBeenCalledWith("pages.product.filter.allStatus");
    });

    it("應該在選擇特定狀態時使用對應的翻譯", () => {
      mockGetFilterValue.mockReturnValue("active");

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 驗證狀態翻譯函數被調用
      expect(mockT).toHaveBeenCalledWith("pages.product.status.active");
    });

    it("語言切換時應該正確更新顯示", () => {
      const { rerender } = render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 模擬語言切換 - 更新翻譯函數返回值
      const mockTChinese = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          "table.headers.product.productStatus": "商品狀態",
          "pages.product.filter.allStatus": "全部",
          "pages.product.status.active": "上架中",
          "pages.product.status.inactive": "下架中",
        };
        return translations[key] || key;
      });

      (useTranslation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        t: mockTChinese,
      });

      // 重新渲染組件
      rerender(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 驗證中文翻譯被使用
      expect(mockTChinese).toHaveBeenCalledWith(
        "table.headers.product.productStatus"
      );
      expect(mockTChinese).toHaveBeenCalledWith(
        "pages.product.filter.allStatus"
      );
    });
  });

  describe("邊界情況測試", () => {
    it("statusCounts 為 0 時應該正確顯示", async () => {
      mockGetFilterValue.mockReturnValue(undefined);

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 0, active: 0, inactive: 0 }}
        />
      );

      // 點擊選單觸發器
      const trigger = screen.getByRole("combobox");
      fireEvent.click(trigger);

      // 等待選單項目出現
      await waitFor(() => {
        expect(screen.getByText("All (0)")).toBeInTheDocument();
        expect(screen.getByText("Active (0)")).toBeInTheDocument();
        expect(screen.getByText("Inactive (0)")).toBeInTheDocument();
      });
    });

    it("column.getFilterValue 返回無效值時應該當作未篩選處理", () => {
      mockGetFilterValue.mockReturnValue("invalid_status");

      render(
        <StatusColumnFilter
          column={mockColumn}
          statusCounts={{ total: 100, active: 70, inactive: 30 }}
        />
      );

      // 應該顯示 "All" 作為預設值
      expect(screen.getByText("All")).toBeInTheDocument();
    });
  });
});
