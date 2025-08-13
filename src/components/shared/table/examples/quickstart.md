# DataTable 分頁筆數選擇器快速開始指南

## 🚀 5 分鐘快速上手

### 1. 基本設置（必要步驟）

```typescript
import { useState } from "react";
import { type PaginationState } from "@tanstack/react-table";
import { paginationSchema } from "@/services/types/schema";
import DataTable from "@/components/shared/DataTable";

const MyPage = () => {
  // 步驟 1: 設置分頁狀態
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 從 0 開始
    pageSize: paginationSchema.parse({}).limit, // 預設 20
  });

  // 步驟 2: 獲取資料
  const { data, isLoading } = useGetDataList({
    page: pagination.pageIndex + 1, // 轉換為 1-based
    limit: pagination.pageSize,
  });

  // 步驟 3: 使用 DataTable
  return (
    <DataTable
      data={data?.data || []}
      columns={columns}
      isLoading={isLoading}
      pagination={{
        state: pagination,
        onPaginationChange: setPagination,
        total: data?.total ?? 0,
        // 可選：自訂分頁選項
        pageSizeOptions: [5, 10, 20, 50, 100],
      }}
    />
  );
};
```

### 2. 常用配置模板

#### 小型資料集（< 100 筆）

```typescript
pageSizeOptions: [5, 10, 20];
```

#### 中型資料集（100-1000 筆）

```typescript
pageSizeOptions: [10, 20, 50];
```

#### 大型資料集（> 1000 筆）

```typescript
pageSizeOptions: [20, 50, 100];
```

### 3. 複製貼上模板

```typescript
// 🔥 複製此模板到您的頁面
import { useState } from "react";
import { type PaginationState } from "@tanstack/react-table";
import { paginationSchema } from "@/services/types/schema";
import DataTable from "@/components/shared/DataTable";

const YourListPage = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginationSchema.parse({}).limit,
  });

  const { data: yourData, isLoading } = useGetYourDataList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  return (
    <DataTable
      data={yourData?.data || []}
      columns={yourColumns}
      isLoading={isLoading}
      pagination={{
        state: pagination,
        onPaginationChange: setPagination,
        total: yourData?.total ?? 0,
        pageSizeOptions: [5, 10, 20, 50], // 根據需求調整
      }}
    />
  );
};
```

## ⚠️ 注意事項

1. **pageIndex 是 0-based**：內部使用 0 開始，API 調用時 +1
2. **必須提供 total**：用於計算總頁數
3. **pageSizeOptions 可選**：不提供時使用預設值 `[5, 10, 20, 30, 50, 100]`

## 🔧 故障排除

### 問題：分頁選擇器沒有顯示

```typescript
// ❌ 缺少 pagination props
<DataTable data={data} columns={columns} />

// ✅ 提供完整的 pagination props
<DataTable
  data={data}
  columns={columns}
  pagination={{
    state: pagination,
    onPaginationChange: setPagination,
    total: data?.total ?? 0,
  }}
/>
```

### 問題：頁碼跳轉錯誤

```typescript
// ❌ 直接使用 pageIndex
page: pagination.pageIndex;

// ✅ 轉換為 1-based
page: pagination.pageIndex + 1;
```

## 📚 更多資源

- [完整使用範例](./datatable-pagesize-usage.md)
- [需求規格文檔](../task/components/datatable-pagesize-selector.md)
- [API 文檔](../api/datatable.md)

---

**完整實作時間**: 5 分鐘  
**難度**: 簡單  
**最後更新**: 2025-07-08
