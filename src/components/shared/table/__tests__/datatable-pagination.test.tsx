import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import DataTable from "../../DataTable";

import type { PaginationState } from "@tanstack/react-table";

/**
 * DataTable 分頁功能測試
 *
 * 此測試檔案專注測試 DataTable 組件的分頁核心功能，包括：
 * - 分頁資訊顯示 (當前頁碼、總頁數)
 * - 總頁數計算邏輯 (各種數據量與頁面大小的組合)
 * - 分頁控制器的顯示/隱藏邏輯
 * - 分頁按鈕的渲染狀態
 * - 邊界情況處理 (空資料、極大數值等)
 * - 載入狀態下的分頁行為
 *
 * 不包含交互行為測試 (點擊、狀態變更等)，這些由整合測試負責
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

// Mock UI components
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

describe("DataTable 分頁功能測試", () => {
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

  const mockOnPaginationChange = vi.fn();

  describe("分頁資訊顯示", () => {
    it("應該正確顯示當前頁碼和總頁數", () => {
      const paginationState: PaginationState = {
        pageIndex: 0, // 0-based，第1頁
        pageSize: 20,
      };

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={{
            state: paginationState,
            onPaginationChange: mockOnPaginationChange,
            total: 100, // 總共5頁
          }}
        />
      );

      expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
    });

    it("應該將 0-based pageIndex 轉換為 1-based 顯示", () => {
      const paginationState: PaginationState = {
        pageIndex: 2, // 0-based，第3頁
        pageSize: 20,
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

      expect(screen.getByText("Page 3 of 5")).toBeInTheDocument();
    });

    it("應該在總數為0時顯示問號", () => {
      const paginationState: PaginationState = {
        pageIndex: 0,
        pageSize: 20,
      };

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={{
            state: paginationState,
            onPaginationChange: mockOnPaginationChange,
            total: 0,
          }}
        />
      );

      expect(screen.getByText("Page 1 of ?")).toBeInTheDocument();
    });
  });

  describe("總頁數計算", () => {
    const testCases = [
      { total: 100, pageSize: 20, expectedPages: 5 },
      { total: 95, pageSize: 20, expectedPages: 5 }, // 無條件進位
      { total: 81, pageSize: 20, expectedPages: 5 }, // 無條件進位
      { total: 80, pageSize: 20, expectedPages: 4 }, // 整除
      { total: 1, pageSize: 20, expectedPages: 1 }, // 小於頁面大小
    ];

    testCases.forEach(({ total, pageSize, expectedPages }) => {
      it(`應該正確計算總頁數: ${total} 筆資料，每頁 ${pageSize} 筆 = ${expectedPages} 頁`, () => {
        const paginationState: PaginationState = {
          pageIndex: 0,
          pageSize,
        };

        render(
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
      });
    });
  });

  describe("分頁控制器顯示", () => {
    it("應該在有分頁時顯示分頁控制器", () => {
      const paginationState: PaginationState = {
        pageIndex: 0,
        pageSize: 20,
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

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
    });

    it("應該在沒有分頁時不顯示分頁控制器", () => {
      render(<DataTable data={mockData} columns={mockColumns} />);

      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });
  });

  describe("分頁按鈕狀態", () => {
    it("應該渲染分頁按鈕", () => {
      const paginationState: PaginationState = {
        pageIndex: 0,
        pageSize: 20,
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

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);

      // 確認按鈕存在
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
  });

  describe("邊界情況處理", () => {
    it("應該處理 total 為 undefined 的情況", () => {
      const paginationState: PaginationState = {
        pageIndex: 0,
        pageSize: 20,
      };

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={{
            state: paginationState,
            onPaginationChange: mockOnPaginationChange,
            total: undefined as unknown as number,
          }}
        />
      );

      expect(screen.getByText("Page 1 of ?")).toBeInTheDocument();
    });

    it("應該處理非常大的 total 值", () => {
      const paginationState: PaginationState = {
        pageIndex: 0,
        pageSize: 20,
      };

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          pagination={{
            state: paginationState,
            onPaginationChange: mockOnPaginationChange,
            total: 999999,
          }}
        />
      );

      expect(screen.getByText("Page 1 of 50000")).toBeInTheDocument();
    });
  });

  describe("載入狀態", () => {
    it("應該在載入時顯示載入指示器", () => {
      render(
        <DataTable data={mockData} columns={mockColumns} isLoading={true} />
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("應該在載入時隱藏分頁控制器", () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          isLoading={true}
          pagination={{
            state: { pageIndex: 0, pageSize: 20 },
            onPaginationChange: mockOnPaginationChange,
            total: 100,
          }}
        />
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });
  });
});
