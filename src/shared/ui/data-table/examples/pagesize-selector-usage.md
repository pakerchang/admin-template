# DataTable 分頁筆數選擇器使用範例

建立日期：2025-07-08  
版本：1.0.0  
相關功能：DataTable 分頁筆數選擇器

## 📋 概述

此文件提供 DataTable 分頁筆數選擇器的完整使用範例和最佳實踐指南。

## 🎯 基本使用方式

### 1. 基本設置

```typescript
import { useState } from "react";
import { type PaginationState } from "@tanstack/react-table";
import { paginationSchema } from "@/shared/api/schema";
import DataTable from "@/shared/ui/data-table/data-table";

const MyListPage = () => {
  // 使用 PaginationState 管理分頁狀態
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 0-based index
    pageSize: paginationSchema.parse({}).limit, // 預設 20
  });

  // 使用 API hook 獲取資料
  const { data, isLoading } = useGetDataList({
    page: pagination.pageIndex + 1, // 轉換為 1-based
    limit: pagination.pageSize,
  });

  return (
    <DataTable
      data={data?.data || []}
      columns={columns}
      isLoading={isLoading}
      pagination={{
        state: pagination,
        onPaginationChange: setPagination,
        total: data?.total ?? 0,
        pageSizeOptions: [5, 10, 20, 30, 50, 100], // 自訂選項
      }}
    />
  );
};
```

## 📐 進階使用範例

### 2. 產品列表頁面範例

```typescript
// src/pages/product/ProductList.tsx
import { useState } from "react";
import { type PaginationState } from "@tanstack/react-table";
import { useGetProductList } from "@/hooks/api/product";
import { paginationSchema } from "@/shared/api/schema";
import DataTable from "@/shared/ui/data-table/data-table";

const ProductList = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginationSchema.parse({}).limit,
  });

  const { data: productList, isLoading } = useGetProductList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  return (
    <DataTable
      data={productList?.data || []}
      columns={columns}
      isLoading={isLoading}
      pagination={{
        state: pagination,
        onPaginationChange: setPagination,
        total: productList?.total ?? 0,
        pageSizeOptions: [5, 10, 20, 50], // 產品適用的選項
      }}
      enableColumnVisibility={true}
      columnVisibilityStorageKey="products-table"
    />
  );
};
```

### 3. 使用者列表頁面範例

```typescript
// src/pages/users/UserList.tsx
import { useState } from "react";
import { type PaginationState } from "@tanstack/react-table";
import { useGetUserList } from "@/hooks/api/user";
import { paginationSchema } from "@/shared/api/schema";
import DataTable from "@/shared/ui/data-table/data-table";

const UserList = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginationSchema.parse({}).limit,
  });

  const { data: userList, isLoading } = useGetUserList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  return (
    <DataTable
      data={userList?.data || []}
      columns={columns}
      isLoading={isLoading}
      pagination={{
        state: pagination,
        onPaginationChange: setPagination,
        total: userList?.total ?? 0,
        pageSizeOptions: [10, 20, 30, 50, 100], // 使用者適用的選項
      }}
    />
  );
};
```

### 4. 訂單列表頁面範例（含搜尋功能）

```typescript
// src/pages/orders/OrderList.tsx
import { useState } from "react";
import { type PaginationState } from "@tanstack/react-table";
import { useGetOrderList } from "@/hooks/api/order";
import { paginationSchema } from "@/shared/api/schema";
import DataTable from "@/shared/ui/data-table/data-table";

const OrderList = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginationSchema.parse({}).limit,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const { data: orderList, isLoading } = useGetOrderList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: searchTerm,
  });

  return (
    <DataTable
      data={orderList?.data || []}
      columns={columns}
      isLoading={isLoading}
      pagination={{
        state: searchTerm
          ? { pageIndex: 0, pageSize: pagination.pageSize } // 搜尋時重置頁碼
          : pagination,
        onPaginationChange: searchTerm
          ? () => {} // 搜尋時禁用分頁控制
          : setPagination,
        total: orderList?.total ?? 0,
        pageSizeOptions: [10, 20, 50, 100], // 訂單適用的選項
      }}
      enableColumnVisibility={true}
      columnVisibilityStorageKey="orders-table"
    />
  );
};
```

## 🔧 自訂配置選項

### 5. 不同場景的 pageSizeOptions 建議

```typescript
// 小型資料集（如設置項目）
pageSizeOptions: [5, 10, 15, 20];

// 中型資料集（如產品列表）
pageSizeOptions: [5, 10, 20, 50];

// 大型資料集（如使用者列表）
pageSizeOptions: [10, 20, 30, 50, 100];

// 超大型資料集（如日誌記錄）
pageSizeOptions: [20, 50, 100, 200];

// 報表類型（需要查看更多資料）
pageSizeOptions: [50, 100, 200, 500];
```

## 📊 最佳實踐指南

### 6. 狀態管理最佳實踐

```typescript
// ✅ 推薦：使用 PaginationState
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0, // 0-based，內部使用
  pageSize: 20,
});

// ✅ 推薦：API 調用時轉換為 1-based
const { data } = useGetDataList({
  page: pagination.pageIndex + 1, // 轉換為 1-based
  limit: pagination.pageSize,
});

// ❌ 不推薦：直接使用 1-based 狀態
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(20);
```

### 7. 錯誤處理

```typescript
const MyListPage = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data, isLoading, error } = useGetDataList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  // 錯誤處理
  if (error) {
    return <div>載入失敗：{error.message}</div>;
  }

  return (
    <DataTable
      data={data?.data || []}
      columns={columns}
      isLoading={isLoading}
      pagination={{
        state: pagination,
        onPaginationChange: setPagination,
        total: data?.total ?? 0,
        pageSizeOptions: [5, 10, 20, 50],
      }}
    />
  );
};
```

### 8. 性能優化

```typescript
// ✅ 推薦：使用 useMemo 優化 columns
const columns = useMemo(
  () => [
    // column definitions
  ],
  []
);

// ✅ 推薦：使用 useCallback 優化事件處理
const handlePaginationChange = useCallback(
  (updater: Updater<PaginationState>) => {
    setPagination(updater);
  },
  []
);

// ✅ 推薦：使用 React Query 的快取機制
const { data, isLoading } = useGetDataList(
  {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  },
  {
    staleTime: 5 * 60 * 1000, // 5 分鐘
    cacheTime: 10 * 60 * 1000, // 10 分鐘
  }
);
```

## 🌐 多語言支援

### 9. 翻譯鍵值對應

```typescript
// 中文 (zh.json)
"table": {
  "pagination": {
    "itemsPerPage": "每頁顯示",
    "itemsSelected": "筆"
  }
}

// 英文 (en.json)
"table": {
  "pagination": {
    "itemsPerPage": "Items per page",
    "itemsSelected": "items"
  }
}

// 泰文 (th.json)
"table": {
  "pagination": {
    "itemsPerPage": "รายการต่อหน้า",
    "itemsSelected": "รายการ"
  }
}
```

### 10. 使用 i18n 的範例

```typescript
import { useTranslation } from "react-i18next";

const MyListPage = () => {
  const { t } = useTranslation();

  // DataTable 會自動使用翻譯
  return (
    <DataTable
      data={data?.data || []}
      columns={columns}
      pagination={{
        state: pagination,
        onPaginationChange: setPagination,
        total: data?.total ?? 0,
        pageSizeOptions: [5, 10, 20, 50],
      }}
    />
  );
};
```

## 🔍 常見問題解決

### 11. 常見問題與解決方案

#### Q: 頁碼顯示錯誤？

```typescript
// ❌ 錯誤：直接使用 pageIndex
<span>第 {pagination.pageIndex} 頁</span>

// ✅ 正確：轉換為 1-based 顯示
<span>第 {pagination.pageIndex + 1} 頁</span>
```

#### Q: 變更 pageSize 後頁碼沒有重置？

```typescript
// ✅ TanStack Table 會自動處理頁碼重置
// 使用 table.setPageSize() 會自動重置到第一頁
<Select
  value={pagination.state.pageSize.toString()}
  onValueChange={(value) => {
    table.setPageSize(Number(value)) // 自動重置頁碼
  }}
>
```

#### Q: 搜尋時分頁狀態衝突？

```typescript
// ✅ 搜尋時重置分頁狀態
const searchPagination = searchTerm
  ? { pageIndex: 0, pageSize: pagination.pageSize }
  : pagination

<DataTable
  pagination={{
    state: searchPagination,
    onPaginationChange: searchTerm ? () => {} : setPagination,
    total: data?.total ?? 0,
  }}
/>
```

## 📋 測試指南

### 12. 測試範例

```typescript
// 單元測試範例
describe("DataTable 分頁筆數選擇器", () => {
  test("應該顯示正確的分頁筆數選項", () => {
    const mockData = createMockData(100);

    render(
      <DataTable
        data={mockData}
        columns={columns}
        pagination={{
          state: { pageIndex: 0, pageSize: 20 },
          onPaginationChange: jest.fn(),
          total: 100,
          pageSizeOptions: [10, 20, 50],
        }}
      />
    );

    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  test("變更分頁筆數應該觸發回調", () => {
    const mockOnChange = jest.fn();

    render(
      <DataTable
        data={mockData}
        columns={columns}
        pagination={{
          state: { pageIndex: 0, pageSize: 20 },
          onPaginationChange: mockOnChange,
          total: 100,
          pageSizeOptions: [10, 20, 50],
        }}
      />
    );

    fireEvent.change(screen.getByDisplayValue("20"), {
      target: { value: "50" },
    });
    expect(mockOnChange).toHaveBeenCalled();
  });
});
```

## 🔗 相關資源

- [TanStack Table 官方文檔](https://tanstack.com/table/latest/docs/guide/pagination)
- [React i18next 文檔](https://react.i18next.com/)
- [專案 DataTable 組件文檔](../components/DataTable.md)
- [分頁筆數選擇器需求文檔](../task/components/datatable-pagesize-selector.md)

---

**最後更新**: 2025-07-08  
**維護者**: Frontend Team
