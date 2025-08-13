# OrderList Search Enhancement - Order ID 條件搜尋任務

## 📋 任務背景

目前 OrderList 頁面僅支援基本的時間排序功能（created_at, updated_at），缺乏針對特定訂單 ID 的搜尋功能。為了提升用戶體驗和操作效率，需要新增一個 search bar 讓用戶能夠快速搜尋特定的訂單。

## 🎯 任務目標

在 OrderList 頁面新增 search bar 功能，支援：

1. **🔍 Order ID 搜尋**：用戶可以輸入完整或部分 order_id 進行搜尋
2. **⚡ 即時搜尋**：支援 debounced 搜尋，避免過於頻繁的 API 請求
3. **🔄 搜尋與排序協調**：搜尋條件與現有排序功能協同工作
4. **📱 響應式設計**：確保在不同螢幕尺寸下都有良好的使用體驗

## 📊 現狀分析

### 當前 OrderList 功能
- **✅ 基本排序**：支援 created_at, updated_at 排序
- **✅ 分頁功能**：完整的分頁導航
- **✅ API 整合**：使用 TanStack Table 原生 API 排序
- **❌ 搜尋功能**：目前缺乏任何搜尋功能

### 後端 API 支援評估
需要確認：
1. **Order API 合約**：檢查 `orderContract.getOrders` 是否支援搜尋參數
2. **搜尋參數格式**：確認後端期望的搜尋參數格式
3. **搜尋範圍**：確認可搜尋的欄位（order_id, customer_name 等）

## 🔧 實作計畫

### Phase 1: 後端 API 支援檢查
- [ ] 檢查 `src/services/contacts/orders.ts` 中的 API 合約
- [ ] 確認後端是否支援搜尋參數（如 `search`, `order_id`, `q` 等）
- [ ] 測試現有 API 是否接受搜尋參數

### Phase 2: 前端搜尋功能實作
- [ ] 在 OrderList 組件中新增搜尋狀態管理
- [ ] 實作 debounced 搜尋邏輯（建議 300-500ms delay）
- [ ] 更新 `useGetOrderList` hook 支援搜尋參數
- [ ] 確保搜尋與分頁、排序的協調機制

### Phase 3: UI/UX 設計與實作
- [ ] 設計搜尋框的視覺樣式和位置
- [ ] 新增搜尋圖示和清除搜尋功能
- [ ] 實作搜尋狀態的載入指示器
- [ ] 新增搜尋結果的空狀態處理

### Phase 4: 測試與優化
- [ ] 測試搜尋功能的正確性
- [ ] 測試搜尋與排序的協調工作
- [ ] 測試不同搜尋條件下的 API 請求
- [ ] 性能優化和用戶體驗調整

## 📋 技術規格

### 搜尋參數格式
```typescript
interface OrderSearchParams {
  search?: string        // 通用搜尋參數
  order_id?: string     // 特定 order_id 搜尋
  // 其他可能的搜尋欄位...
}
```

### API 整合模式
```typescript
// 更新後的 API 呼叫
const { data: orderResponse, isLoading } = useGetOrderList({
  page,
  limit,
  search: searchTerm,  // 新增搜尋參數
  ...apiSortingParams,
})
```

### UI 組件設計
```typescript
// 搜尋框組件結構
<div className="flex items-center space-x-2 mb-4">
  <Search className="size-4 text-gray-400" />
  <Input
    placeholder="搜尋訂單 ID..."
    value={searchTerm}
    onChange={handleSearchChange}
    className="max-w-sm"
  />
  {searchTerm && (
    <Button variant="ghost" size="sm" onClick={clearSearch}>
      <X className="size-4" />
    </Button>
  )}
</div>
```

## 🛠️ 實作細節

### Debounced 搜尋實作
```typescript
import { useDebouncedCallback } from 'use-debounce'

const [searchTerm, setSearchTerm] = useState("")
const [apiSearchTerm, setApiSearchTerm] = useState("")

const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    setApiSearchTerm(value)
    setPage(1) // 搜尋時重置到第1頁
  },
  500
)

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value
  setSearchTerm(value)
  debouncedSearch(value)
}
```

### 狀態協調機制
- **搜尋優先級**：當有搜尋條件時，顯示搜尋結果
- **分頁重置**：新搜尋時自動重置到第1頁
- **排序保持**：搜尋結果仍可進行排序
- **快取策略**：不同搜尋條件使用不同的 queryKey

## 📈 期望成果

### 功能指標
- [x] 用戶可以快速搜尋特定 order_id
- [x] 搜尋響應時間 < 1秒
- [x] 搜尋結果準確且完整
- [x] 搜尋與排序功能協同工作

### 用戶體驗指標
- [x] 直觀的搜尋界面設計
- [x] 清晰的搜尋狀態反饋
- [x] 流暢的搜尋操作體驗
- [x] 適當的空狀態處理

## 🚀 後續擴展可能性

1. **多欄位搜尋**：支援同時搜尋 order_id, customer_name, status 等
2. **進階搜尋**：支援搜尋條件組合和篩選器
3. **搜尋歷史**：記錄用戶的搜尋歷史
4. **搜尋建議**：提供自動完成和搜尋建議

## 📝 注意事項

1. **API 依賴性**：此功能的實作完全依賴後端 API 支援
2. **性能考量**：需要適當的 debouncing 避免過度請求
3. **用戶習慣**：搜尋功能需要符合用戶的使用習慣
4. **錯誤處理**：需要妥善處理搜尋失敗的情況

---

**任務狀態**: 📋 待開始  
**預估工期**: 1-2 個工作日  
**優先級**: 中等  
**依賴項目**: 後端 API 搜尋支援確認