# DataTable 分頁筆數選擇功能需求文件

建立日期：2025-07-08  
需求編號：REQ-DATATABLE-001  
相關 Issue：#30

## 📋 需求概述

在現有的 DataTable 組件中新增一個下拉式選單，讓使用者可以動態選擇每頁顯示的資料筆數，以改善資料瀏覽體驗。

## 🎯 目標

1. 提供使用者自訂每頁顯示筆數的能力
2. 減少不必要的分頁操作，提升資料瀏覽效率
3. 保持與現有 pagination 邏輯的相容性
4. 維持一致的 UI/UX 設計風格

## 📐 技術規格

### 影響檔案
- `src/components/shared/DataTable.tsx` - 主要修改檔案
- `src/locales/{en,th,zh}.json` - 新增翻譯文字
- 使用該組件的所有頁面（需要傳遞新的 props）

### 使用的 UI 組件
- 使用專案內現有的 `src/components/ui/select.tsx` 組件
- 該組件基於 Radix UI 的 Select Primitive

### 現有結構分析

#### DataTable 組件
- 已支援 pagination props，包含：
  - `page`: 當前頁碼
  - `limit`: 每頁筆數
  - `total`: 總筆數
  - `onPageChange`: 頁碼變更回調

#### API 層面
- 所有 API contracts 使用統一的 `paginationSchema`
- 定義在 `src/services/types/schema.ts`：
  ```typescript
  export const paginationSchema = z.object({
    page: z.number().default(1),
    limit: z.number().default(20),
  })
  ```
- 預設 `limit` 為 20 筆

## 🔧 實施方案

### Phase 1: DataTable 組件修改

#### 1.1 新增 Props 定義
```typescript
interface DataTableProps<T> {
  // ... existing props
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
    // 新增
    onPageSizeChange?: (pageSize: number) => void
    pageSizeOptions?: number[]
  }
}
```

#### 1.2 預設值設定
- 預設 `pageSizeOptions`: `[5, 10, 20, 30, 50, 100]`
- 預設選中值：20（來自 `paginationSchema` 的預設值）
- 如果未提供 `onPageSizeChange`，則不顯示選單

#### 1.3 UI 實作位置
- 在分頁控制區域（第 250-279 行）新增 Select 組件
- 位置：在「上一頁」按鈕之前
- 格式：「每頁顯示 [20 v] 筆」

#### 1.4 Select 組件與 DataTable 的互動邏輯
當使用者透過 Select 組件變更每頁顯示筆數時：
1. **觸發 `onPageSizeChange` callback**：將新的 pageSize 值傳遞給父組件
2. **Select 組件顯示更新**：Select 的 `value` prop 應綁定到 `pagination.limit`，確保顯示當前選中的值
3. **頁碼重置邏輯**：
   - 父組件收到新的 pageSize 後，應自動將 page 重置為 1
   - 這是因為變更每頁筆數可能導致總頁數改變，當前頁碼可能超出新的範圍
4. **DataTable 內部狀態同步**：
   - DataTable 透過 `pagination.limit` prop 接收新的每頁筆數
   - 透過 `pagination.page` prop 接收重置後的頁碼
   - 內部的 TanStack Table 實例會自動更新顯示

實作範例：
```tsx
// 在 DataTable 組件內部
{hasPagination && (
  <div className="flex items-center justify-between py-4">
    <div className="flex items-center space-x-2">
      {/* 新增：每頁筆數選擇器 */}
      {pagination.onPageSizeChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {t("table.pagination.pageSize")}
          </span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => {
              pagination.onPageSizeChange?.(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(pagination.pageSizeOptions || [5, 10, 20, 30, 50, 100]).map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {t("table.pagination.items")}
          </span>
        </div>
      )}
      
      {/* 既有的分頁按鈕 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {t("table.pagination.previous")}
      </Button>
      {/* ... */}
    </div>
  </div>
)}
```

### Phase 2: 翻譯文字新增

需要在三個語言檔案中新增：

#### 2.1 中文 (zh.json)
```json
"table": {
  "pagination": {
    "previous": "上一頁",
    "next": "下一頁",
    "pageInfo": "第 {{currentPage}} 頁，共 {{totalPages}} 頁",
    "pageSize": "每頁顯示",
    "items": "筆"
  }
}
```

#### 2.2 英文 (en.json)
```json
"table": {
  "pagination": {
    "previous": "Previous",
    "next": "Next",
    "pageInfo": "Page {{currentPage}} of {{totalPages}}",
    "pageSize": "Show",
    "items": "items per page"
  }
}
```

#### 2.3 泰文 (th.json)
```json
"table": {
  "pagination": {
    "previous": "ก่อนหน้า",
    "next": "ถัดไป",
    "pageInfo": "หน้า {{currentPage}} จาก {{totalPages}}",
    "pageSize": "แสดง",
    "items": "รายการต่อหน้า"
  }
}
```

### Phase 3: 頁面層級整合

#### 3.1 State 管理範例
```tsx
// 在使用 DataTable 的組件中
const [page, setPage] = useState(paginationSchema.parse({}).page)
const [limit, setLimit] = useState(paginationSchema.parse({}).limit) // 改為 state

// 使用 hook 時傳入 page 和 limit
const { data, isLoading } = useGetProductList({
  page,
  limit,
  ...otherParams
})
```

#### 3.2 DataTable 使用範例 (TanStack Table Best Practice)
```tsx
// 使用 TanStack Table 的 PaginationState
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0, // 注意：pageIndex 是 0-based
  pageSize: 20,
})

// 使用 hook 時傳入 pagination 狀態
const { data, isLoading } = useGetProductList({
  page: pagination.pageIndex + 1, // 轉換為 1-based
  limit: pagination.pageSize,
  ...otherParams
})

// 使用 TanStack Table 的 best practice
<DataTable
  data={data}
  columns={columns}
  pagination={{
    state: pagination,
    onPaginationChange: setPagination, // 直接使用 setPagination
    total: data?.total ?? 0,
    pageSizeOptions: [5, 10, 20, 30, 50, 100] // 可選，有預設值
  }}
/>
```

### Phase 4: API 銜接注意事項

#### 4.1 現有 Hook 結構
所有資料列表 hooks（如 `useGetProductList`、`useGetBannerList` 等）都遵循相同模式：
- 接收 `pagination` 參數（包含 `page` 和 `limit`）
- 將參數傳遞給 API client
- 使用參數作為 React Query 的 `queryKey` 一部分

#### 4.2 queryKey 更新
當 `limit` 改變時，需要確保 queryKey 包含新的 limit 值，以觸發重新請求：
```typescript
const queryKey = useMemo(() => {
  return ["productList", page, limit, ...otherParams]
}, [page, limit, ...otherParams])
```

#### 4.3 快取策略
- 不同的 `limit` 值會被視為不同的查詢，各自獨立快取
- 使用者在不同的每頁筆數間切換時，如果該組合已被快取且未過期，會直接顯示快取資料

## 📋 待執行階段

### Phase 1: DataTable 組件核心功能實作
- [x] **Phase 1.1**: 更新 DataTableProps interface 定義 - 完成於 2025-07-08
- [x] **Phase 1.2**: 實作 Select 組件整合到分頁區域 - 完成於 2025-07-08
- [x] **Phase 1.3**: 處理 pageSize 變更邏輯與頁碼重置 - 完成於 2025-07-08
- [x] **Phase 1.4**: 重構為 TanStack Table Best Practice - 完成於 2025-07-08

### Phase 2: 多語言支援
- [x] **Phase 2.1**: 更新中文翻譯檔 (zh.json) - 完成於 2025-07-08
- [x] **Phase 2.2**: 更新英文翻譯檔 (en.json) - 完成於 2025-07-08
- [x] **Phase 2.3**: 更新泰文翻譯檔 (th.json) - 完成於 2025-07-08

### Phase 3: 頁面整合更新
- [x] **Phase 3.1**: 更新所有使用 DataTable 的頁面，將 limit 改為 state - 完成於 2025-07-08
- [x] **Phase 3.2**: 確保所有 hooks 的 queryKey 包含 limit 參數 - 完成於 2025-07-08
- [x] **Phase 3.3**: 測試每個頁面的分頁筆數選擇功能 - 完成於 2025-07-08

### Phase 4: 測試與驗證
- [x] **Phase 4.1**: 單元測試撰寫 - 完成於 2025-07-08
- [x] **Phase 4.2**: 整合測試與使用範例 - 完成於 2025-07-08
- [x] **Phase 4.3**: 文件更新與程式碼審查 - 完成於 2025-07-08

## 🔍 注意事項

1. **向後相容性**：確保不影響現有使用 DataTable 的頁面
2. **效能考量**：變更 pageSize 時需要重新請求資料，注意 loading 狀態處理
3. **邊界情況**：
   - 當變更 pageSize 導致當前頁碼超出範圍時，自動重置為第 1 頁
   - 確保 pageSize 選項合理（建議範圍 5-100）
   - 雖然系統預設值為 20，但可提供更小的選項（如 5、10）供使用者選擇
4. **無障礙性**：確保 Select 組件有適當的 aria-label
5. **API 限制**：某些 API 可能有最大筆數限制，需要在實作時確認
6. **UI 一致性**：
   - Select 組件的寬度應適中，建議 70px
   - 保持與現有分頁控制元件的視覺平衡
   - 確保在不同語言下都有良好的顯示效果

## 📊 預期效益

1. 使用者可以根據需求調整每頁顯示筆數
2. 減少分頁次數，提高資料瀏覽效率
3. 提供更好的使用者體驗，特別是在處理大量資料時
4. 統一的分頁控制介面，提升整體產品一致性
5. 提供更靈活的資料檢視選項，從小量資料（5筆）到大量資料（100筆）都能適應

## 🔧 最新變更記錄

### 2025-07-08 追加功能
- **新增 5 筆選項**：將預設 pageSizeOptions 從 `[10, 20, 30, 50, 100]` 更新為 `[5, 10, 20, 30, 50, 100]`
- **完成 Phase 3 所有任務**：所有使用 DataTable 的頁面都已更新並測試完成
- **確認 TanStack Table 最佳實踐**：使用 0-based pageIndex 內部處理，API 和 UI 顯示時轉換為 1-based
- **驗證轉換策略**：確保所有 8 個頁面組件都正確實作轉換邏輯

### 2025-07-08 Phase 4.1 完成內容
- **完整測試套件**：撰寫 36 個單元測試，涵蓋所有核心功能
  - `datatable-pagination.test.tsx`：分頁邏輯核心測試 (15 個測試)
  - `datatable-pagesize-selector.test.tsx`：頁面大小選擇器測試 (9 個測試)
  - `datatable-integration.test.tsx`：完整交互流程測試 (12 個測試)
- **測試架構優化**：將測試檔案重組到 `src/components/shared/table/__tests__/` 目錄
- **測試品質提升**：
  - 修正所有 TypeScript 類型問題
  - 優化 mock 設定，確保測試穩定性
  - 為所有測試檔案添加詳細的功能說明註解
- **代碼品質改善**：移除 DataTable.tsx 中不必要的註解，提升代碼可讀性
- **完整測試覆蓋**：包含邊界情況、錯誤處理、多語言支援等全面測試

### 2025-07-08 Phase 4.2 完成內容
- **整合測試驗證**：手動完成所有功能的整合測試，確認分頁筆數選擇器正常運作
- **使用範例建立**：建立完整的使用範例文件系統
  - `src/components/shared/table/examples/README.md`：範例總覽與導航
  - `src/components/shared/table/examples/pagesize-selector-usage.md`：詳細使用範例（12 個場景）
  - `src/components/shared/table/examples/quickstart.md`：5 分鐘快速開始指南
- **文件結構優化**：採用 feature-based 組織方式，將範例文件與組件放在同一目錄
- **開發者體驗提升**：
  - 提供複製貼上的程式碼模板
  - 涵蓋小型、中型、大型資料集的使用場景
  - 包含錯誤處理、性能優化、多語言支援指南
  - 提供常見問題解決方案與測試範例

### 2025-07-08 Phase 4.3 完成內容
- **文件更新完成**：更新需求文件進度，記錄所有 Phase 完成狀態
- **程式碼品質檢查**：
  - ESLint 檢查通過，無程式碼品質問題
  - TypeScript 編譯檢查通過，無類型錯誤
  - Build 流程正常，產品可以正常打包
- **測試驗證**：
  - DataTable 相關測試 36/36 全部通過
  - 分頁筆數選擇器功能測試完全正常
  - 其他模組測試問題與本功能無關
- **向後相容性驗證**：
  - 檢查所有 8 個使用 DataTable 的頁面組件
  - 確認所有頁面都正確使用 `onPaginationChange` 和 `state` 格式
  - 驗證現有功能完全不受影響，100% 向後相容

## 🔗 相關參考

- [Radix UI Select Documentation](https://www.radix-ui.com/docs/primitives/components/select)
- [TanStack Table Pagination Guide](https://tanstack.com/table/latest/docs/guide/pagination)
- 現有 DataTable 組件：`src/components/shared/DataTable.tsx`
- Select UI 組件：`src/components/ui/select.tsx`
- API Schema 定義：`src/services/types/schema.ts`
- 參考實作：`src/pages/product/ProductList.tsx`