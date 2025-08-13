# 表格欄位顯示控制功能 - 工程任務文件

## 1. 功能需求描述

### 1.1 核心需求

為整個專案中所有使用 table list 的頁面新增欄位顯示控制功能，讓使用者可以自訂要顯示哪些欄位。

### 1.2 功能特性

- **控制方式**: 下拉式選單（Dropdown）介面
- **欄位來源**: 顯示原 Table 定義的所有欄位
- **使用者體驗**: 即時顯示/隱藏欄位變更
- **狀態持久化**: 使用者設定自動儲存至 localStorage

### 1.3 適用範圍

以下頁面的 table 組件需要實作此功能：

| 頁面       | 檔案路徑                                   | Table 類型 | 欄位數量 |
| ---------- | ------------------------------------------ | ---------- | -------- |
| 使用者管理 | `/src/pages/users/UserList.tsx`            | DataTable  | 8 個欄位 |
| 訂單管理   | `/src/pages/orders/OrderList.tsx`          | DataTable  | 7 個欄位 |
| 商品管理   | `/src/pages/product/ProductList.tsx`       | DataTable  | 8 個欄位 |
| 消費者管理 | `/src/pages/consumers/ConsumerList.tsx`    | DataTable  | 9 個欄位 |
| 文章管理   | `/src/pages/articles/ArticleList.tsx`      | DataTable  | 8 個欄位 |
| 員工管理   | `/src/pages/staff-users/StaffUserList.tsx` | DataTable  | 待確認   |

**注意**: 橫幅管理頁面使用拖拽排序的 ImageCard，不適用此功能。

### 1.4 技術基礎分析

#### 1.4.1 現有架構

專案使用現代化的 table 實作架構：

- **核心框架**: @tanstack/react-table v8.21.3
- **UI 基礎**: shadcn/ui + Tailwind CSS
- **共享組件**: `DataTable` 作為統一的 table 封裝
- **類型支援**: 完整的 TypeScript 泛型支援

#### 1.4.2 欄位定義模式

所有頁面使用統一的 `ColumnDef<T>[]` 結構：

```typescript
const columns: ColumnDef<T>[] = [
  {
    accessorKey: string, // 資料欄位名
    enableHiding: boolean, // 是否可隱藏
    enableSorting: boolean, // 是否可排序
    header: () => ReactNode, // 表頭渲染
    cell: ({ row }) => ReactNode, // 儲存格渲染
  },
]
```

#### 1.4.3 TanStack Table 內建功能

根據官方文件分析，@tanstack/react-table 已內建完整的欄位顯示控制功能：

**狀態管理**:

```typescript
// 欄位可見性狀態類型
type VisibilityState = Record<string, boolean>

// 管理可見性狀態
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
  columnId1: true,
  columnId2: false, // 預設隱藏
})
```

**Table API**:

- `table.getVisibleLeafColumns()`: 獲取可見欄位
- `table.getAllColumns()`: 獲取所有欄位
- `column.getIsVisible()`: 檢查欄位可見性
- `column.getCanHide()`: 檢查欄位是否可隱藏
- `column.getToggleVisibilityHandler()`: 切換可見性處理函數

## 2. 技術規格

### 2.1 架構設計

#### 2.1.1 解耦設計原則

每個頁面的 table 欄位配置不同，需要採用注入式設計：

```typescript
// 1. 共享 Hook 設計
interface UseColumnVisibilityOptions<T> {
  columns: ColumnDef<T>[]
  storageKey: string
  defaultVisibility?: VisibilityState
}

function useColumnVisibility<T>(options: UseColumnVisibilityOptions<T>) {
  // 處理 localStorage 狀態管理
  // 返回 columnVisibility 狀態和相關方法
}

// 2. 共享 UI 組件設計
interface ColumnVisibilityDropdownProps<TData = unknown> {
  table: Table<TData>
  align?: "start" | "end"
}

function ColumnVisibilityDropdown<TData = unknown>({
  table,
  align,
}: ColumnVisibilityDropdownProps<TData>) {
  // 渲染下拉選單 UI
}
```

#### 2.1.2 狀態管理架構

```typescript
// localStorage 鍵值命名規範
const STORAGE_KEYS = {
  USERS_TABLE: "admin-dashboard:table-visibility:users",
  ORDERS_TABLE: "admin-dashboard:table-visibility:orders",
  PRODUCTS_TABLE: "admin-dashboard:table-visibility:products",
  CONSUMERS_TABLE: "admin-dashboard:table-visibility:consumers",
  ARTICLES_TABLE: "admin-dashboard:table-visibility:articles",
  STAFF_USERS_TABLE: "admin-dashboard:table-visibility:staff-users",
} as const
```

### 2.2 預設顯示策略

#### 2.2.1 預設值來源

各頁面預設顯示欄位以目前實際顯示的欄位為準：

**使用者管理預設顯示**:

```typescript
const defaultVisibility: VisibilityState = {
  user_id: true,
  role: true,
  name: true, // 組合欄位
  phone_number: true,
  email: true,
  created_at: true,
  updated_at: true,
  actions: true,
}
```

**訂單管理預設顯示**:

```typescript
const defaultVisibility: VisibilityState = {
  order_id: true,
  agent_id: true,
  remark: true,
  order_status: true,
  created_at: true,
  updated_at: true,
  actions: true,
}
```

**商品管理預設顯示**:

```typescript
const defaultVisibility: VisibilityState = {
  thumbnail: true,
  product_type: true,
  product_name: true,
  product_id: true,
  product_size: true,
  product_price: true,
  product_status: true,
  actions: true,
}
```

#### 2.2.2 不可隱藏欄位

以下欄位應設定 `enableHiding: false`：

- **actions**: 操作欄位（編輯、刪除等）
- **主要識別欄位**: 如 `user_id`、`order_id`、`product_id`（依業務需求決定）

### 2.3 UI/UX 規格

#### 2.3.1 下拉選單設計

```typescript
// 使用 shadcn/ui 組件
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"
```

**視覺設計要求**:

- 觸發按鈕：Settings2 圖示 + "欄位顯示" 文字
- 選單項目：Checkbox + 欄位名稱（使用 i18n 翻譯）
- 位置：表格右上角，與其他操作按鈕對齊
- 響應式：在小螢幕上優雅降級

#### 2.3.2 多語言支援

需要新增以下翻譯鍵值：

```typescript
// zh.json (繁體中文)
{
  "table": {
    "columnVisibility": "欄位顯示",
    "showHideColumns": "顯示/隱藏欄位"
  }
}

// en.json (英文)
{
  "table": {
    "columnVisibility": "Column Visibility",
    "showHideColumns": "Show/Hide Columns"
  }
}

// th.json (泰文)
{
  "table": {
    "columnVisibility": "การแสดงคอลัมน์",
    "showHideColumns": "แสดง/ซ่อนคอลัมน์"
  }
}
```

### 2.4 資料持久化規格

#### 2.4.1 localStorage 結構

```typescript
// 簡化儲存格式
interface TableVisibilityStorage {
  hasCustomSettings: boolean // 是否有自訂設定
  visibility: VisibilityState // 欄位可見性狀態
}

// 範例儲存內容
localStorage.setItem(
  "admin-dashboard:table-visibility:users",
  JSON.stringify({
    hasCustomSettings: true,
    visibility: {
      user_id: true,
      role: false,
      name: true,
      phone_number: true,
      email: true,
      created_at: false,
      updated_at: false,
      actions: true,
    },
  })
)
```

#### 2.4.2 錯誤處理策略

- localStorage 不可用時：回退到記憶體狀態管理
- 資料格式錯誤時：使用預設顯示設定
- `hasCustomSettings` 為 false 或不存在時：使用預設設定
- 驗證邏輯：檢查是否存在有效的 `hasCustomSettings` 標記

## 3. 實作步驟

### 3.1 階段一：基礎邏輯架構 (3-4 天)

#### 3.1.1 建立型別定義

```typescript
// 檔案: src/types/table-visibility.ts
export interface UseColumnVisibilityOptions<TData = unknown> {
  columns: ColumnDef<TData>[]
  storageKey: string
  defaultVisibility?: VisibilityState
}

export interface ColumnVisibilityDropdownProps<TData = unknown> {
  table: Table<TData>
  align?: "start" | "end"
}

export interface TableVisibilityStorage {
  hasCustomSettings: boolean // 是否有自訂設定
  visibility: VisibilityState // 欄位可見性狀態
}
```

#### 3.1.2 建立共享 Hook

```typescript
// 檔案: src/hooks/useColumnVisibility.ts
export function useColumnVisibility<TData = unknown>(
  options: UseColumnVisibilityOptions<TData>
) {
  // 實作 localStorage 同步邏輯
  // 回傳 columnVisibility 狀態和相關方法
}
```

#### 3.1.3 建立工具函數

```typescript
// 檔案: src/utils/table-visibility.ts
export const TABLE_VISIBILITY_STORAGE_KEYS = {
  /* ... */
}
export function getDefaultVisibility<TData = unknown>(
  columns: ColumnDef<TData>[]
): VisibilityState
export function saveVisibilityToStorage(
  key: string,
  visibility: VisibilityState
): void
export function loadVisibilityFromStorage(
  key: string
): TableVisibilityStorage | null
```

#### 3.1.4 建立共享 UI 組件

```typescript
// 檔案: src/components/shared/ColumnVisibilityDropdown.tsx
export function ColumnVisibilityDropdown<TData = unknown>({
  table,
  align,
}: ColumnVisibilityDropdownProps<TData>) {
  // 實作下拉選單 UI
}
```

#### 3.1.5 新增多語言翻譯

更新 `src/locales/` 下的翻譯檔案。

#### 3.1.6 Git Commit

```bash
git commit -m "feat: implement column visibility control infrastructure #25

- Add type definitions for column visibility
- Create useColumnVisibility hook
- Add utility functions for localStorage management
- Create ColumnVisibilityDropdown component
- Add i18n translations for column visibility"
```

### 3.2 階段二：整合現有 DataTable (1-2 天)

#### 3.2.1 擴展 DataTable 組件

```typescript
// 檔案: src/components/shared/DataTable.tsx
interface DataTableProps<TData = unknown> {
  // ... 現有 props
  enableColumnVisibility?: boolean
  columnVisibilityStorageKey?: string
  columnVisibilityAlign?: "start" | "end"
}
```

#### 3.2.2 修改 DataTable 實作

- 整合 `useColumnVisibility` hook
- 在表格工具欄新增 `ColumnVisibilityDropdown`
- 確保向後相容性
- 完善 TypeScript 泛型支援

#### 3.2.3 Git Commit

```bash
git commit -m "feat: integrate column visibility into DataTable component #25

- Add column visibility props to DataTable interface
- Integrate useColumnVisibility hook
- Add ColumnVisibilityDropdown to table toolbar
- Maintain backward compatibility"
```

### 3.3 階段三：各頁面逐步整合 (3-4 天)

#### 3.3.1 優先順序與分批實作

**第一批 (1-2 天)**:

1. **使用者管理** (UserList.tsx) - 作為範例實作
2. **訂單管理** (OrderList.tsx)

**第二批 (1-2 天)**: 3. **商品管理** (ProductList.tsx) 4. **消費者管理** (ConsumerList.tsx)

**第三批 (1 天)**: 5. **文章管理** (ArticleList.tsx) 6. **員工管理** (StaffUserList.tsx)

#### 3.3.2 各頁面整合步驟

1. 分析現有欄位定義，確認預設顯示狀態
2. 設定不可隱藏欄位（`enableHiding: false`）
3. 為欄位定義添加完善的型別支援
4. 啟用 DataTable 的欄位顯示控制功能
5. 測試功能正常運作
6. 驗證 localStorage 儲存功能

#### 3.3.3 Git Commit 策略

每批完成後進行 commit：

```bash
# 第一批
git commit -m "feat: add column visibility to user and order management pages #25"

# 第二批
git commit -m "feat: add column visibility to product and consumer management pages #25"

# 第三批
git commit -m "feat: add column visibility to article and staff management pages #25"
```

### 3.4 階段四：測試與優化 (1-2 天)

#### 3.4.1 功能測試

- 各頁面欄位顯示/隱藏功能
- 狀態持久化測試
- 多語言介面測試
- 響應式設計測試

#### 3.4.2 效能測試

- 大量資料下的渲染效能
- localStorage 讀寫效能
- 記憶體使用情況

#### 3.4.3 使用者體驗測試

- 操作流暢度
- 視覺回饋
- 錯誤處理

#### 3.4.4 Git Commit

```bash
git commit -m "test: add comprehensive tests for column visibility feature #25

- Add unit tests for useColumnVisibility hook
- Add component tests for ColumnVisibilityDropdown
- Add integration tests for all pages
- Performance optimization and bug fixes"
```

## 4. 測試計畫

### 4.1 單元測試

#### 4.1.1 Hook 測試

```typescript
// 檔案: src/hooks/__tests__/useColumnVisibility.test.ts
describe("useColumnVisibility", () => {
  test("應該從 localStorage 載入儲存的設定", () => {})
  test("應該在設定變更時更新 localStorage", () => {})
  test("應該在 localStorage 不可用時使用預設設定", () => {})
  test("應該正確處理無效的儲存資料", () => {})
})
```

#### 4.1.2 工具函數測試

```typescript
// 檔案: src/utils/__tests__/table-visibility.test.ts
describe("table-visibility utils", () => {
  test("getDefaultVisibility 應該回傳正確的預設狀態", () => {})
  test("saveVisibilityToStorage 應該正確儲存資料並設定 hasCustomSettings", () => {})
  test("loadVisibilityFromStorage 應該正確載入資料", () => {})
  test("當 hasCustomSettings 為 false 時應該回傳 null", () => {})
  test("避免使用 any 型別，使用泛型或 unknown", () => {})
})
```

### 4.2 整合測試

#### 4.2.1 組件測試

```typescript
// 檔案: src/components/shared/__tests__/ColumnVisibilityDropdown.test.tsx
describe("ColumnVisibilityDropdown", () => {
  test("應該渲染所有可隱藏的欄位選項", () => {})
  test("應該正確顯示欄位的可見性狀態", () => {})
  test("應該在點擊時切換欄位可見性", () => {})
  test("應該禁用不可隱藏的欄位選項", () => {})
})
```

#### 4.2.2 頁面整合測試

針對每個頁面建立測試，確保：

- 欄位顯示控制功能正常運作
- 預設顯示狀態正確
- localStorage 整合無誤

### 4.3 E2E 測試

#### 4.3.1 使用者流程測試

```typescript
// 使用 Playwright 或 Cypress
describe("Column Visibility E2E", () => {
  test("使用者可以隱藏和顯示表格欄位", async () => {
    // 1. 訪問使用者管理頁面
    // 2. 點擊欄位顯示按鈕
    // 3. 取消勾選某個欄位
    // 4. 驗證欄位被隱藏
    // 5. 重新整理頁面
    // 6. 驗證設定被保留
  })

  test("不可隱藏欄位應該被禁用", async () => {})
  test("多語言介面應該正確顯示", async () => {})
})
```

### 4.4 效能測試

#### 4.4.1 渲染效能測試

- 測試 1000+ 行資料的表格渲染效能
- 測試欄位切換的響應時間
- 測試 localStorage 讀寫延遲

#### 4.4.2 記憶體泄漏測試

- 長時間使用後的記憶體使用情況
- 組件卸載時的清理情況

## 5. 技術風險與因應策略

### 5.1 相容性風險

#### 5.1.1 TanStack Table 版本相容性

**風險**: 專案使用的 @tanstack/react-table v8.21.3 可能與最新文件有差異
**因應**:

- 在開發前確認當前版本的 API 文檔
- 建立小型 POC 驗證核心功能
- 準備升級計畫（如有必要）

#### 5.1.2 現有 DataTable 相容性

**風險**: 修改共享 DataTable 組件可能影響現有功能
**因應**:

- 採用向後相容的擴展方式
- 充分的回歸測試
- 分階段部署

### 5.2 效能風險

#### 5.2.1 大量欄位的渲染效能

**風險**: 欄位數量多時，切換可見性可能造成卡頓
**因應**:

- 使用 React.memo 優化不必要的重渲染
- 實作虛擬滾動（如果需要）
- 設定合理的欄位數量上限

#### 5.2.2 localStorage 效能

**風險**: 頻繁的 localStorage 操作可能影響效能
**因應**:

- 實作防抖機制，避免過度儲存
- 考慮使用 sessionStorage 作為臨時快取

### 5.3 使用者體驗風險

#### 5.3.1 操作複雜度

**風險**: 功能過於複雜，使用者學習成本高
**因應**:

- 設計直觀的 UI 介面
- 提供預設的常用組合
- 考慮新增「重置為預設」功能

#### 5.3.2 行動裝置體驗

**風險**: 小螢幕上的下拉選單操作困難
**因應**:

- 響應式設計，大螢幕用下拉選單，小螢幕用 Modal
- 觸控友善的界面設計

## 6. 部署與維護

### 6.1 部署策略

#### 6.1.1 分階段部署

1. **Beta 版本**: 僅在開發環境啟用，內部測試
2. **灰度發布**: 為部分使用者啟用功能
3. **全面發布**: 確認無誤後全面啟用

#### 6.1.2 功能開關

實作 feature flag，可以快速啟用/停用功能：

```typescript
// 環境變數控制
const ENABLE_COLUMN_VISIBILITY =
  process.env.VITE_ENABLE_COLUMN_VISIBILITY === "true"
```

### 6.2 監控與維護

#### 6.2.1 使用情況監控

- 追蹤功能使用率
- 分析最常隱藏/顯示的欄位
- 監控效能指標

#### 6.2.2 錯誤監控

- localStorage 錯誤追蹤
- 組件渲染錯誤監控
- 使用者操作錯誤回報

### 6.3 未來擴展計畫

#### 6.3.1 進階功能

- 欄位排序功能
- 預設佈局儲存
- 匯出/匯入設定
- 團隊共享設定

#### 6.3.2 其他表格功能整合

- 欄位寬度記憶
- 篩選條件持久化
- 排序狀態記憶

---

**文件版本**: v1.1.0  
**建立日期**: 2025-06-20  
**更新日期**: 2025-06-20  
**負責團隊**: Frontend Team  
**Issue 編號**: #25  
**預估工期**: 8-12 天  
**優先級**: High

## 更新記錄

### v1.1.0 (2025-06-20)

- 新增 Git Commit 規範，包含 issue hashtag #25
- 重新規劃實作階段：基礎邏輯架構 → DataTable 整合 → 分批頁面整合 → 測試優化
- 完善 TypeScript 型別定義，避免使用 `any`，改用泛型或 `unknown`
- 簡化資料持久化策略，移除版本控制，使用 `hasCustomSettings` 標記
- 新增詳細的分批實作策略和 Git Commit 流程
