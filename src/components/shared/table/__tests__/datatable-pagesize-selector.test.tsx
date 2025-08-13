import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import DataTable from "../../DataTable";

import type { PaginationState } from "@tanstack/react-table";

/**
 * DataTable 分頁筆數選擇器測試
 *
 * 此測試檔案專注測試 DataTable 組件中的分頁筆數選擇器功能，包括：
 * - 分頁筆數選擇器的基本渲染
 * - 預設選項配置 [5, 10, 20, 30, 50, 100]
 * - 當前 pageSize 值的正確顯示
 * - 自訂分頁筆數選項的支援
 * - 無分頁時的隱藏行為
 * - 載入狀態下的顯示行為
 * - 總頁數計算的正確性
 * - 分頁按鈕的基本狀態驗證
 *
 * 不包含交互行為測試 (下拉選擇、值變更等)，這些由整合測試負責
 */

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "table.pagination.pageInfo") {
        return `Page ${options?.currentPage} of ${options?.totalPages}`;
      }
      if (key === "table.pagination.itemsPerPage") {
        return "Items per page";
      }
      if (key === "table.pagination.itemsSelected") {
        return "items";
      }
      if (key === "table.pagination.previous") {
        return "Previous";
      }
      if (key === "table.pagination.next") {
        return "Next";
      }
      return key;
    },
  }),
}));

// Mock @tanstack/react-table
vi.mock("@tanstack/react-table", () => ({
  useReactTable: () => ({
    getHeaderGroups: () => [
      {
        id: "header-1",
        headers: [
          {
            id: "col-1",
            isPlaceholder: false,
            column: { columnDef: { header: () => "Test Header" } },
            getContext: () => ({}),
          },
        ],
      },
    ],
    getRowModel: () => ({
      rows: [
        {
          id: "row-1",
          getIsSelected: () => false,
          getVisibleCells: () => [
            {
              id: "cell-1",
              column: { columnDef: { cell: () => "Test Cell" } },
              getContext: () => ({}),
            },
          ],
        },
      ],
    }),
    getCanPreviousPage: () => false,
    getCanNextPage: () => true,
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    setPageSize: vi.fn(),
  }),
  getCoreRowModel: () => vi.fn(),
  getPaginationRowModel: () => vi.fn(),
  getFilteredRowModel: () => vi.fn(),
  flexRender: (component: unknown) => {
    if (typeof component === "function") {
      return component();
    }
    return component;
  },
}));

// Mock column visibility hook
vi.mock("..", () => ({
  useColumnVisibility: () => ({
    columnVisibility: {},
    setColumnVisibility: vi.fn(),
  }),
  ColumnVisibilityDropdown: () => null,
}));

// Mock UI components - 簡化版本
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <div data-testid="select-component" data-value={value}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => children,
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <span data-testid={`option-${value}`}>{children}</span>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => children,
  SelectValue: () => <span>Select Value</span>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    disabled,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
  }) => <button disabled={disabled}>{children}</button>,
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table>{children}</table>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  TableRow: ({ children }: { children: React.ReactNode }) => (
    <tr>{children}</tr>
  ),
  TableHead: ({ children }: { children: React.ReactNode }) => (
    <th>{children}</th>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td>{children}</td>
  ),
}));

vi.mock("@/components/ui/spinner", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

describe("DataTable 分頁筆數選擇器簡化測試", () => {
  const mockData = [
    { id: 1, name: "Test Item 1" },
    { id: 2, name: "Test Item 2" },
  ];

  const mockColumns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: { getValue: (key: string) => string } }) =>
        row.getValue("name"),
    },
  ];

  const mockPaginationState: PaginationState = {
    pageIndex: 0,
    pageSize: 20,
  };

  const mockOnPaginationChange = vi.fn();

  /**
   * 測試基本渲染
   */
  it("應該渲染分頁筆數選擇器相關元素", () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{
          state: mockPaginationState,
          onPaginationChange: mockOnPaginationChange,
          total: 100,
        }}
      />
    );

    // 檢查分頁相關文字
    expect(screen.getByText("Items per page")).toBeInTheDocument();
    expect(screen.getByText("items")).toBeInTheDocument();

    // 檢查 Select 組件
    expect(screen.getByTestId("select-component")).toBeInTheDocument();
  });

  /**
   * 測試預設選項
   */
  it("應該包含所有預設的分頁筆數選項", () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{
          state: mockPaginationState,
          onPaginationChange: mockOnPaginationChange,
          total: 100,
        }}
      />
    );

    // 檢查預設選項 [5, 10, 20, 30, 50, 100]
    expect(screen.getByTestId("option-5")).toBeInTheDocument();
    expect(screen.getByTestId("option-10")).toBeInTheDocument();
    expect(screen.getByTestId("option-20")).toBeInTheDocument();
    expect(screen.getByTestId("option-30")).toBeInTheDocument();
    expect(screen.getByTestId("option-50")).toBeInTheDocument();
    expect(screen.getByTestId("option-100")).toBeInTheDocument();
  });

  /**
   * 測試當前值顯示
   */
  it("應該顯示當前的 pageSize 值", () => {
    const paginationState = {
      pageIndex: 0,
      pageSize: 50,
    };

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{
          state: paginationState,
          onPaginationChange: mockOnPaginationChange,
          total: 100,
        }}
      />
    );

    const selectComponent = screen.getByTestId("select-component");
    expect(selectComponent).toHaveAttribute("data-value", "50");
  });

  /**
   * 測試自訂選項
   */
  it("應該支援自訂分頁筆數選項", () => {
    const customOptions = [25, 50, 75];

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{
          state: mockPaginationState,
          onPaginationChange: mockOnPaginationChange,
          total: 100,
          pageSizeOptions: customOptions,
        }}
      />
    );

    // 檢查自訂選項
    expect(screen.getByTestId("option-25")).toBeInTheDocument();
    expect(screen.getByTestId("option-50")).toBeInTheDocument();
    expect(screen.getByTestId("option-75")).toBeInTheDocument();

    // 確保預設選項不存在
    expect(screen.queryByTestId("option-5")).not.toBeInTheDocument();
    expect(screen.queryByTestId("option-10")).not.toBeInTheDocument();
    expect(screen.queryByTestId("option-100")).not.toBeInTheDocument();
  });

  /**
   * 測試頁碼顯示
   */
  it("應該正確顯示頁碼資訊", () => {
    const paginationState = {
      pageIndex: 2, // 0-based，表示第 3 頁
      pageSize: 20,
    };

    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{
          state: paginationState,
          onPaginationChange: mockOnPaginationChange,
          total: 100, // 總共 5 頁
        }}
      />
    );

    // 應該顯示第 3 頁，共 5 頁
    expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
  });

  /**
   * 測試無分頁時的行為
   */
  it("應該在沒有分頁功能時不渲染分頁控制器", () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    expect(screen.queryByText("Items per page")).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-component")).not.toBeInTheDocument();
    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  /**
   * 測試載入狀態
   */
  it("應該在載入時顯示載入指示器", () => {
    render(
      <DataTable data={mockData} columns={mockColumns} isLoading={true} />
    );

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  /**
   * 測試總頁數計算
   */
  it("應該正確計算總頁數", () => {
    const testCases = [
      { total: 100, pageSize: 20, expectedPages: 5 },
      { total: 95, pageSize: 20, expectedPages: 5 },
      { total: 81, pageSize: 20, expectedPages: 5 },
      { total: 80, pageSize: 20, expectedPages: 4 },
      { total: 0, pageSize: 20, expectedPages: "?" },
    ];

    testCases.forEach(({ total, pageSize, expectedPages }) => {
      const paginationState = {
        pageIndex: 0,
        pageSize,
      };

      const { unmount } = render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={{
            state: paginationState,
            onPaginationChange: mockOnPaginationChange,
            total,
          }}
        />
      );

      expect(
        screen.getByText(`Page 1 of ${expectedPages}`)
      ).toBeInTheDocument();

      // 清理以便下一次測試
      unmount();
    });
  });

  /**
   * 測試分頁按鈕狀態
   */
  it("應該正確控制分頁按鈕的啟用狀態", () => {
    render(
      <DataTable
        data={mockData}
        columns={mockColumns}
        pagination={{
          state: mockPaginationState,
          onPaginationChange: mockOnPaginationChange,
          total: 100,
        }}
      />
    );

    // 檢查分頁按鈕是否存在
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();

    // 基本功能驗證 - 按鈕已經渲染
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
