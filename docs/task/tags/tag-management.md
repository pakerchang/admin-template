# 標籤管理系統 (Tag Management System)

## 📋 概述

建立一個完整的標籤管理系統，包含標籤的列表顯示、新增、編輯、刪除和搜尋功能。此頁面的 UI/UX 設計參考 `src/pages/staff-users/` 的實作模式。

## 🎯 功能需求

### 核心功能
1. **標籤列表頁面** - 以表格形式顯示所有標籤
2. **新增標籤** - 透過對話框表單新增標籤
3. **編輯標籤** - 編輯現有標籤資訊
4. **刪除標籤** - 刪除標籤（需確認對話框）
5. **搜尋功能** - 支援 tag_id 和 tag_name 欄位搜尋過濾
6. **排序功能** - 支援欄位排序（API 端排序）
7. **分頁功能** - 資料分頁顯示

## 📊 資料結構

### 標籤資料模型
```typescript
// 創建標籤請求 (POST)
interface TagCreateData {
  tag_name: string
}

// 更新標籤請求 (PUT)
interface TagUpdateData {
  tag_id: string
  tag_name: string
}

// 標籤完整資料（API 回應）
interface Tag {
  tag_id: string           // 後端提供的唯一識別碼
  tag_name: string         // 標籤名稱
  created_at?: string      // ISO 8601 格式
  updated_at?: string      // ISO 8601 格式
}

// 列表 API 參數
interface TagListParams {
  page: number
  limit: number
  search?: string          // 依據 tag_id 或 tag_name 欄位進行搜尋過濾
  sort_by?: 'tag_name' | 'created_at' | 'updated_at'
  order?: 'asc' | 'desc'
}

// 列表 API 回應
interface TagListResponse {
  data: Tag[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 刪除標籤請求 (DELETE)
interface TagDeleteData {
  tag_id: string
}
```

## 🏗️ 實作架構

### 資料夾結構
```
src/pages/tags/
├── TagList.tsx              # 主要列表頁面元件
├── components/
│   └── TagFormDialog.tsx    # 新增/編輯表單對話框
└── hooks/
    └── use-tag.ts           # 標籤相關的自訂 hooks
```

### 路由設定
```typescript
// 路由路徑：/tags
// 檔案位置：src/routes/tags.tsx
```

### Sidebar 選單設定
需要在 `src/constants/sidebar.tsx` 中新增標籤選項：

1. 在檔案頂部的 import 區塊中加入圖示：
```typescript
import {
  Package,
  UserCog,
  Images,
  Receipt,
  Users,
  FileText,
  Building2,
  Tags, // 新增標籤圖示
} from "lucide-react"
```

2. 在 sidebarMenu 陣列中適當位置加入：
```typescript
{
  label: "dashboard.menu.tags.title",
  icon: <Tags className="text-white" />,
  path: "tags",
},
```

## 🔧 技術實作細節

### 1. API 設計

#### API Endpoints
```typescript
// 使用 ts-rest 定義 API contracts
const tagContract = {
  // 取得標籤列表
  getTags: {
    method: "GET",
    path: "/api/v1/admin/tag",
    query: z.object({
      page: z.number(),
      limit: z.number(),
      search: z.string().optional(), // 依據 tag_id 或 tag_name 欄位搜尋過濾
      sort_by: z.enum(['tag_name', 'created_at', 'updated_at']).optional(),
      order: z.enum(['asc', 'desc']).optional(),
    }),
    responses: {
      200: tagListResponseSchema,
    },
  },

  // 取得單一標籤
  getTag: {
    method: "GET",
    path: "/api/v1/admin/tag/:tag_id",
    responses: {
      200: tagSchema,
    },
  },

  // 新增標籤
  createTag: {
    method: "POST",
    path: "/api/v1/admin/tag",
    body: z.object({
      tag_name: z.string().min(1, "標籤名稱為必填"),
    }),
    responses: {
      201: tagSchema,
    },
  },

  // 更新標籤
  updateTag: {
    method: "PUT",
    path: "/api/v1/admin/tag/:tag_id",
    body: z.object({
      tag_id: z.string(),
      tag_name: z.string().min(1, "標籤名稱為必填"),
    }),
    responses: {
      200: tagSchema,
    },
  },

  // 刪除標籤
  deleteTag: {
    method: "DELETE",
    path: "/api/v1/admin/tag/:tag_id",
    body: z.object({
      tag_id: z.string(),
    }),
    responses: {
      204: z.void(),
    },
  },
}
```

### 2. 列表頁面功能

#### 表格欄位定義
```typescript
const columns: ColumnDef<Tag>[] = [
  {
    accessorKey: "tag_id",
    header: () => t("table.headers.tag.tagId"),
    enableHiding: false, // 主要識別欄位不可隱藏
  },
  {
    accessorKey: "tag_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {t("table.headers.tag.tagName")}
        <ArrowUpDown className="ml-2 size-4" />
      </Button>
    ),
    enableSorting: true,
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
                onClick={() => handleEditTag(row.original)}
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
// 使用前端搜尋過濾，依據 tag_id 和 tag_name 欄位（參考 staff-users 實作）
const filteredData = useMemo(() => {
  if (!tagResponse?.data) return []
  if (!searchTerm.trim()) return tagResponse.data

  const lowercaseSearch = searchTerm.toLowerCase()
  return tagResponse.data.filter((tag) => {
    return (
      tag.tag_id.toLowerCase().includes(lowercaseSearch) ||
      tag.tag_name.toLowerCase().includes(lowercaseSearch)
    )
  })
}, [tagResponse?.data, searchTerm])
```

### 3. 表單對話框元件

#### TagFormDialog 功能
- 支援新增和編輯模式
- 使用 React Hook Form + Zod 進行表單驗證
- 簡化的表單結構（僅標籤名稱）
- 包含載入狀態處理

#### 表單驗證 Schema
```typescript
const tagFormSchema = z.object({
  tag_name: z.string().min(1, "標籤名稱為必填"),
})
```

### 4. 自訂 Hooks

#### use-tag.ts
```typescript
// 取得標籤列表
export const useGetTagList = (params: TagListParams) => {
  return useQuery({
    queryKey: ["tags", params],
    queryFn: () => client.tags.getTags({ query: params }),
  })
}

// 新增標籤
export const useCreateTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TagCreateData) => 
      client.tags.createTag({ body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      toast.success(t("messages.createSuccess"))
    },
  })
}

// 更新標籤
export const useUpdateTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagUpdateData }) =>
      client.tags.updateTag({ 
        params: { tag_id: id },
        body: data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      toast.success(t("messages.updateSuccess"))
    },
  })
}

// 刪除標籤
export const useDeleteTag = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TagDeleteData) =>
      client.tags.deleteTag({ 
        params: { tag_id: data.tag_id },
        body: data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
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
      "tags": {
        "title": "標籤管理"
      }
    }
  },
  "pages": {
    "tag": {
      "title": "標籤管理",
      "description": "管理系統中的所有標籤",
      "addTag": "新增標籤",
      "editTag": "編輯標籤",
      "deleteConfirm": "確定要刪除此標籤嗎？",
      "deleteDescription": "此操作無法復原。標籤相關的所有資料將被永久刪除。"
    }
  },
  "table": {
    "headers": {
      "tag": {
        "tagId": "標籤編號",
        "tagName": "標籤名稱"
      }
    }
  },
  "form": {
    "tag": {
      "tagName": "標籤名稱",
      "placeholders": {
        "tagName": "請輸入標籤名稱"
      }
    }
  }
}
```

## 🎨 UI/UX 設計要點

### 參考 Staff Users 頁面的設計模式
1. **頁面布局**
   - 使用 Navbar 元件顯示頁面標題和描述
   - 右上角放置「新增標籤」按鈕
   - 搜尋框位於表格上方

2. **表格設計**
   - 使用 DataTable 元件統一表格樣式
   - 支援排序的欄位顯示排序圖示
   - 操作欄位使用圖示按鈕配合 Tooltip

3. **對話框設計**
   - 使用 Dialog 元件實作表單對話框
   - 簡化的表單結構（僅標籤名稱）
   - 包含適當的載入和錯誤狀態處理

4. **響應式設計**
   - 確保在不同螢幕尺寸下都有良好體驗
   - 表格支援水平滾動
   - 對話框在小螢幕上適當調整

## 📋 實作步驟

**🚨 重要執行要求：**
1. **階段性Review**: 每完成一個階段都必須停下來等待 review 同意後才可以 commit
2. **Commit規範**: 嚴格遵循 commit pattern，使用 issue #28
3. **確認機制**: 遇到執行不明確的狀況必須先確認再進行

### Phase 1: 基礎架構建立
1. 建立路由設定和頁面檔案結構
2. 定義 TypeScript 類型和 Zod schemas
3. 建立 API contracts 使用 ts-rest
**🔄 Phase 1 完成後需等待 review 確認**

### Phase 2: API 整合
1. 實作 API client 整合
2. 建立自訂 hooks (use-tag.ts)
3. 設定 TanStack Query 快取策略
**🔄 Phase 2 完成後需等待 review 確認**

### Phase 3: 列表頁面開發
1. 實作 TagList 主元件
2. 整合 DataTable 元件
3. 實作搜尋和排序功能
4. 加入分頁控制
**🔄 Phase 3 完成後需等待 review 確認**

### Phase 4: 表單功能開發
1. 建立 TagFormDialog 元件
2. 實作表單驗證邏輯
3. 整合新增和編輯功能
4. 加入刪除確認對話框
**🔄 Phase 4 完成後需等待 review 確認**

### Phase 5: 多語言與 UI 整合
1. 新增 sidebar 選單項目
2. 加入多語言翻譯
3. 整合到主要導航系統
**🔄 Phase 5 完成後需等待 review 確認**

### Phase 6: 測試與優化
1. 功能測試各項 CRUD 操作
2. 測試搜尋和排序功能
3. 響應式設計測試
4. 效能優化和錯誤處理
**🔄 Phase 6 完成後需等待 review 確認**

## 🚀 預估工時

- **Phase 1**: 0.5 天（基礎設定）
- **Phase 2**: 0.5 天（API 整合）
- **Phase 3**: 1 天（列表功能）
- **Phase 4**: 0.5 天（表單功能）
- **Phase 5**: 0.5 天（多語言與導航）
- **Phase 6**: 0.5 天（測試優化）

**總計**: 約 3.5 個工作天

## ✅ 驗收標準

1. **功能完整性**
   - ✅ 可以查看所有標籤列表
   - ✅ 可以新增標籤
   - ✅ 可以編輯現有標籤
   - ✅ 可以刪除標籤（需確認）
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
- 標籤系統相較於代理商系統更為簡化，主要處理標籤名稱
- 需要確保與現有系統的風格一致性
- API 路徑統一為 `admin/tag`，符合後端設計規範

---

**文件版本**: v1.1.0  
**建立日期**: 2025-06-21  
**參考文件**: docs/task/suppliers/supplier-management.md  
**Issue 編號**: #28  
**優先級**: High

---

## 🚨 執行規範

### 階段性開發要求
- 每個 Phase 完成後必須停止並等待 review
- 獲得同意後才能進行 commit 操作
- 嚴格按照階段順序執行，不可跳躍

### Commit 規範
- 遵循項目 commit pattern 規範
- 必須包含 issue hash tag: #28
- 參考 docs/rules/commit-rules.md 文件

### 確認機制
- 遇到任何執行不明確的狀況必須先確認
- 不可自行假設或猜測需求
- 確保每個步驟都有明確的指導