# 代理商管理系統 (Supplier Management System)

## 📋 概述

建立一個完整的代理商管理系統，包含代理商的列表顯示、新增、編輯、刪除和搜尋功能。此頁面的 UI/UX 設計參考 `src/pages/staff-users/` 的實作模式。

## 🎯 功能需求

### 核心功能
1. **代理商列表頁面** - 以表格形式顯示所有代理商
2. **新增代理商** - 透過對話框表單新增代理商
3. **編輯代理商** - 編輯現有代理商資訊
4. **刪除代理商** - 刪除代理商（需確認對話框）
5. **搜尋功能** - 支援 supplier_id 和 supplier_name 搜尋
6. **排序功能** - 支援欄位排序（API 端排序）
7. **分頁功能** - 資料分頁顯示

## 📊 資料結構

### 代理商資料模型
```typescript
// 創建/更新代理商請求 (POST/PUT)
interface SupplierFormData {
  supplier_name: string
  contact_info: {
    phone: string
    email: string
    address: string
  }
  remark?: string
}

// 代理商完整資料（API 回應）
interface Supplier extends SupplierFormData {
  supplier_id: string        // 系統產生的唯一識別碼
  created_at: string        // ISO 8601 格式
  updated_at: string        // ISO 8601 格式
}

// 列表 API 參數
interface SupplierListParams {
  page: number
  limit: number
  search?: string           // 搜尋 supplier_id 或 supplier_name
  sort_by?: 'supplier_name' | 'created_at' | 'updated_at'
  order?: 'asc' | 'desc'
}

// 列表 API 回應
interface SupplierListResponse {
  data: Supplier[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

## 🏗️ 實作架構

### 資料夾結構
```
src/pages/suppliers/
├── SupplierList.tsx           # 主要列表頁面元件
├── components/
│   └── SupplierFormDialog.tsx # 新增/編輯表單對話框
└── hooks/
    └── use-supplier.ts        # 代理商相關的自訂 hooks
```

### 路由設定
```typescript
// 路由路徑：/suppliers
// 檔案位置：src/routes/suppliers.tsx
```

### Sidebar 選單設定
需要在 `src/constants/sidebar.tsx` 中新增代理商選項：

1. 在檔案頂部的 import 區塊中加入圖示：
```typescript
import {
  Package,
  UserCog,
  Images,
  Receipt,
  Users,
  FileText,
  Building2, // 新增代理商圖示
} from "lucide-react"
```

2. 在 sidebarMenu 陣列中適當位置（建議在 staff-users 之後）加入：
```typescript
{
  label: "dashboard.menu.suppliers.title",
  icon: <Building2 className="text-white" />,
  path: "suppliers",
},
```

完整的選單順序建議：
1. 消費者管理 (consumers)
2. 員工管理 (staff-users)
3. **代理商管理 (suppliers)** ← 新增
4. 商品管理 (products)
5. 訂單管理 (orders)
6. 橫幅管理 (banners)
7. 文章管理 (articles)

## 🔧 技術實作細節

### 1. API 設計

#### API Endpoints
```typescript
// 使用 ts-rest 定義 API contracts
const supplierContract = {
  // 取得代理商列表
  getSuppliers: {
    method: "GET",
    path: "/api/v1/admin/suppliers",
    query: z.object({
      page: z.number(),
      limit: z.number(),
      search: z.string().optional(),
      sort_by: z.enum(['supplier_name', 'created_at', 'updated_at']).optional(),
      order: z.enum(['asc', 'desc']).optional(),
    }),
    responses: {
      200: supplierListResponseSchema,
    },
  },

  // 取得單一代理商
  getSupplier: {
    method: "GET",
    path: "/api/v1/admin/suppliers/:supplier_id",
    responses: {
      200: supplierSchema,
    },
  },

  // 新增代理商
  createSupplier: {
    method: "POST",
    path: "/api/v1/admin/suppliers",
    body: supplierFormSchema,
    responses: {
      201: supplierSchema,
    },
  },

  // 更新代理商
  updateSupplier: {
    method: "PUT",
    path: "/api/v1/admin/suppliers/:supplier_id",
    body: supplierFormSchema,
    responses: {
      200: supplierSchema,
    },
  },

  // 刪除代理商
  deleteSupplier: {
    method: "DELETE",
    path: "/api/v1/admin/suppliers/:supplier_id",
    responses: {
      204: z.void(),
    },
  },
}
```

### 2. 列表頁面功能

#### 表格欄位定義
```typescript
const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "supplier_id",
    header: () => t("table.headers.supplier.supplierId"),
    enableHiding: false, // 主要識別欄位不可隱藏
  },
  {
    accessorKey: "supplier_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {t("table.headers.supplier.supplierName")}
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    enableSorting: true,
  },
  {
    id: "contact",
    header: () => t("table.headers.supplier.contact"),
    cell: ({ row }) => {
      const contact = row.original.contact_info
      return (
        <div className="space-y-1 text-sm">
          <div>{contact.phone}</div>
          <div className="text-muted-foreground">{contact.email}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "contact_info.address",
    header: () => t("table.headers.supplier.address"),
  },
  {
    accessorKey: "remark",
    header: () => t("table.headers.supplier.remark"),
    cell: ({ row }) => (
      <div className="max-w-xs truncate">
        {row.original.remark || "-"}
      </div>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {t("table.headers.createdAt")}
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => dayjs(row.original.created_at).format("YYYY-MM-DD HH:mm"),
    enableSorting: true,
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {t("table.headers.updatedAt")}
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    cell: ({ row }) => dayjs(row.original.updated_at).format("YYYY-MM-DD HH:mm"),
    enableSorting: true,
  },
  {
    id: "actions",
    header: () => t("table.headers.actions"),
    cell: ({ row }) => (
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditSupplier(row.original)}
              >
                <Edit className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("actions.edit")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteConfirm(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("actions.delete")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
    enableHiding: false,
  },
]
```

#### 搜尋功能實作
```typescript
// 使用前端搜尋過濾（參考 staff-users 實作）
const filteredData = useMemo(() => {
  if (!supplierResponse?.data) return []
  if (!searchTerm.trim()) return supplierResponse.data

  const lowercaseSearch = searchTerm.toLowerCase()
  return supplierResponse.data.filter((supplier) => {
    return (
      supplier.supplier_id.toLowerCase().includes(lowercaseSearch) ||
      supplier.supplier_name.toLowerCase().includes(lowercaseSearch)
    )
  })
}, [supplierResponse?.data, searchTerm])
```

### 3. 表單對話框元件

#### SupplierFormDialog 功能
- 支援新增和編輯模式
- 使用 React Hook Form + Zod 進行表單驗證
- 聯絡資訊使用巢狀表單結構
- 包含載入狀態處理

#### 表單驗證 Schema
```typescript
const supplierFormSchema = z.object({
  supplier_name: z.string().min(1, "代理商名稱為必填"),
  contact_info: z.object({
    phone: z.string().min(1, "聯絡電話為必填"),
    email: z.string().email("請輸入有效的電子郵件"),
    address: z.string().min(1, "地址為必填"),
  }),
  remark: z.string().optional(),
})
```

### 4. 自訂 Hooks

#### use-supplier.ts
```typescript
// 取得代理商列表
export const useGetSupplierList = (params: SupplierListParams) => {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => client.suppliers.getSuppliers({ query: params }),
  })
}

// 新增代理商
export const useCreateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SupplierFormData) => 
      client.suppliers.createSupplier({ body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success(t("messages.createSuccess"))
    },
  })
}

// 更新代理商
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierFormData }) =>
      client.suppliers.updateSupplier({ 
        params: { supplier_id: id },
        body: data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success(t("messages.updateSuccess"))
    },
  })
}

// 刪除代理商
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      client.suppliers.deleteSupplier({ params: { supplier_id: id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
      toast.success(t("messages.deleteSuccess"))
    },
  })
}
```

## 🌐 多語言支援

### 需要新增的翻譯鍵值
```json
// zh.json
{
  "dashboard": {
    "menu": {
      "suppliers": {
        "title": "代理商管理"
      }
    }
  },
  "pages": {
    "supplier": {
      "title": "代理商管理",
      "description": "管理系統中的所有代理商",
      "addSupplier": "新增代理商",
      "editSupplier": "編輯代理商",
      "deleteConfirm": "確定要刪除此代理商嗎？",
      "deleteDescription": "此操作無法復原。代理商相關的所有資料將被永久刪除。"
    }
  },
  "table": {
    "headers": {
      "supplier": {
        "supplierId": "代理商編號",
        "supplierName": "代理商名稱",
        "contact": "聯絡資訊",
        "address": "地址",
        "remark": "備註"
      }
    }
  },
  "form": {
    "supplier": {
      "supplierName": "代理商名稱",
      "phone": "聯絡電話",
      "email": "電子郵件",
      "address": "地址",
      "remark": "備註",
      "placeholders": {
        "supplierName": "請輸入代理商名稱",
        "phone": "請輸入聯絡電話",
        "email": "請輸入電子郵件",
        "address": "請輸入地址",
        "remark": "請輸入備註（選填）"
      }
    }
  }
}
```

## 🎨 UI/UX 設計要點

### 參考 Staff Users 頁面的設計模式
1. **頁面布局**
   - 使用 Navbar 元件顯示頁面標題和描述
   - 右上角放置「新增代理商」按鈕
   - 搜尋框位於表格上方

2. **表格設計**
   - 使用 DataTable 元件統一表格樣式
   - 支援排序的欄位顯示排序圖示
   - 操作欄位使用圖示按鈕配合 Tooltip

3. **對話框設計**
   - 使用 Dialog 元件實作表單對話框
   - 表單使用合理的欄位分組
   - 包含適當的載入和錯誤狀態處理

4. **響應式設計**
   - 確保在不同螢幕尺寸下都有良好體驗
   - 表格支援水平滾動
   - 對話框在小螢幕上適當調整

## 📋 實作步驟

### Phase 1: 基礎架構建立
1. 建立路由設定和頁面檔案結構
2. 定義 TypeScript 類型和 Zod schemas
3. 建立 API contracts 使用 ts-rest

### Phase 2: API 整合
1. 實作 API client 整合
2. 建立自訂 hooks (use-supplier.ts)
3. 設定 TanStack Query 快取策略

### Phase 3: 列表頁面開發
1. 實作 SupplierList 主元件
2. 整合 DataTable 元件
3. 實作搜尋和排序功能
4. 加入分頁控制

### Phase 4: 表單功能開發
1. 建立 SupplierFormDialog 元件
2. 實作表單驗證邏輯
3. 整合新增和編輯功能
4. 加入刪除確認對話框

### Phase 5: 測試與優化
1. 功能測試各項 CRUD 操作
2. 測試搜尋和排序功能
3. 響應式設計測試
4. 效能優化和錯誤處理

## 🚀 預估工時

- **Phase 1**: 0.5 天（基礎設定）
- **Phase 2**: 1 天（API 整合）
- **Phase 3**: 1.5 天（列表功能）
- **Phase 4**: 1 天（表單功能）
- **Phase 5**: 0.5 天（測試優化）

**總計**: 約 4.5 個工作天

## ✅ 驗收標準

1. **功能完整性**
   - ✅ 可以查看所有代理商列表
   - ✅ 可以新增代理商
   - ✅ 可以編輯現有代理商
   - ✅ 可以刪除代理商（需確認）
   - ✅ 搜尋功能正常運作
   - ✅ 排序功能正常運作
   - ✅ 分頁功能正常運作

2. **使用者體驗**
   - ✅ 介面設計與 Staff Users 頁面一致
   - ✅ 所有操作都有適當的回饋
   - ✅ 錯誤訊息清楚明確
   - ✅ 載入狀態顯示正確

3. **技術品質**
   - ✅ TypeScript 類型定義完整
   - ✅ 遵循專案程式碼規範
   - ✅ 適當的錯誤處理
   - ✅ 響應式設計正常

## 📝 備註

- 此功能的 UI/UX 設計完全參考 `src/pages/staff-users/` 的實作模式
- 需要確保與現有系統的風格一致性
- 考慮未來可能需要的擴展功能（如匯出、批量操作等）

---

**文件版本**: v1.0.0  
**建立日期**: 2025-06-21  
**Issue 編號**: #29  
**優先級**: High