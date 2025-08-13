# OrderList Order Status Dropdown Filter - 訂單狀態下拉選單篩選任務

## 🎯 任務目標

在 OrderList 頁面為 order_status 欄位實作下拉選單篩選功能，取代現有的排序機制，提供更直觀的狀態篩選體驗。

## 📋 任務需求

### 1. **🔽 Order Status 下拉選單篩選**
- 將 `order_status` 欄位的排序功能改為下拉選單篩選
- 下拉選單內容顯示所有可用的 order_status 選項
- 支援「全部」選項以清除篩選條件

### 2. **🌐 國際化下拉選單選項**
- 所有下拉選單選項必須支援 i18n 翻譯
- 確保中文、英文、泰文用戶都能理解狀態含義
- 使用現有的狀態翻譯鍵值或擴展翻譯內容

### 3. **🔗 API 參數格式**
- 發送至後端的 API 參數格式：
  ```typescript
  {
    order_status: 'new' | 'pending' | 'paid' | 'shipped' | 'refunded' | 'completed' | 'cancelled',
    order: 'ASC' | 'DESC'  // 保留其他欄位的排序功能
  }
  ```

## 🏗️ 實作規劃

### Phase 1: 分析現有架構
- [x] 檢查 OrderList 組件中 order_status 欄位的定義
- [x] 分析目前的排序機制和 API 整合
- [x] 確認 EOrderStatus 枚舉和相關類型定義

### Phase 2: 設計下拉選單組件和 i18n 支援
- [ ] 檢查現有狀態翻譯鍵值 (`status.*` 和 `pages.order.*`)
- [ ] 創建 OrderStatusFilter 組件
- [ ] 實作完整的 i18n 支援，包含：
  - 所有訂單狀態選項的翻譯
  - "全部" 選項的多語言支援
  - 篩選提示文字的國際化
- [ ] 設計選單 UI 符合現有設計系統

### Phase 3: 整合篩選邏輯
- [ ] 修改 OrderList 組件以支援狀態篩選
- [ ] 更新 API 調用邏輯以傳送篩選參數
- [ ] 確保篩選與現有搜尋和分頁功能的協調

### Phase 4: 測試與優化
- [ ] 測試各種篩選組合
- [ ] 驗證 API 參數正確傳送
- [ ] 確保 UX 流暢性和響應式設計

## 📁 主要檔案

### 需要修改的檔案：
- `src/pages/orders/OrderList.tsx` - 主要組件修改
- `src/services/contacts/orders.ts` - API 介面更新（如需要）
- `src/locales/zh.json` - 中文翻譯文字
- `src/locales/en.json` - 英文翻譯文字  
- `src/locales/th.json` - 泰文翻譯文字

### 新增檔案：
- `src/pages/orders/components/OrderStatusFilter.tsx` - 狀態篩選組件

## 🌐 國際化翻譯需求

### 現有狀態翻譯鍵值檢查：
目前在 `src/locales/*.json` 中已有以下狀態翻譯：
```json
"status": {
  "new": "新訂單/New Order/คำสั่งซื้อใหม่",
  "pending": "處理中/Pending/รอดำเนินการ", 
  "paid": "已付款/Paid/ชำระเงินแล้ว",
  "shipped": "運送中/Shipped/กำลังจัดส่ง",
  "refunded": "已退款/Refunded/คืนเงินแล้ว",
  "completed": "已完成/Completed/สำเร็จ",
  "cancelled": "已取消/Cancelled/ยกเลิก"
}
```

### 需要新增的翻譯鍵值：
```json
"pages": {
  "order": {
    "filter": {
      "allStatus": "全部狀態/All Status/สถานะทั้งหมด",
      "filterByStatus": "按狀態篩選/Filter by Status/กรองตามสถานะ",
      "statusPlaceholder": "選擇訂單狀態/Select order status/เลือกสถานะคำสั่งซื้อ"
    }
  }
}
```

## 🎨 UI/UX 設計要點

### 下拉選單設計：
- 使用 Radix UI Select 組件保持一致性
- 顯示本地化的狀態標籤和對應的視覺指示器（Tag 組件）
- 支援鍵盤導航和無障礙功能
- 每個選項顯示翻譯後的狀態文字

### 整合考量：
- 篩選狀態與搜尋功能的交互
- 清除篩選的便捷操作
- 當前篩選狀態的視覺反饋
- 確保所有 UI 文字都經過翻譯處理

## 🔧 技術細節

### 狀態管理：
```typescript
// 新增篩選狀態
const [statusFilter, setStatusFilter] = useState<EOrderStatus | ''>('')

// API 參數整合
const apiParams = {
  page,
  limit,
  ...apiSortingParams,
  ...(statusFilter && { order_status: statusFilter })
}
```

### i18n 實作範例：
```typescript
// OrderStatusFilter 組件中的狀態選項渲染
const statusOptions = [
  { value: '', label: t('pages.order.filter.allStatus') },
  { value: 'new', label: t('status.new') },
  { value: 'pending', label: t('status.pending') },
  { value: 'paid', label: t('status.paid') },
  { value: 'shipped', label: t('status.shipped') },
  { value: 'refunded', label: t('status.refunded') },
  { value: 'completed', label: t('status.completed') },
  { value: 'cancelled', label: t('status.cancelled') },
]
```

### API 參數格式：
```typescript
interface OrderListParams {
  page: number
  limit: number
  order_status?: EOrderStatus  // 新增篩選參數
  order?: 'ASC' | 'DESC'      // 保留排序參數
  sort_by?: string            // 保留排序欄位
}
```

## 📊 預期成果

1. **功能性**：
   - 使用者可以透過下拉選單快速篩選特定狀態的訂單
   - 篩選功能與現有搜尋、分頁、排序功能無縫整合
   - API 正確傳送篩選參數

2. **使用體驗**：
   - 直觀的狀態篩選操作
   - 清楚的當前篩選狀態指示
   - 快速清除篩選的便捷操作
   - **多語言環境下的完整支援**

3. **技術品質**：
   - 符合現有代碼架構和設計模式
   - 完整的 TypeScript 類型支援
   - **完整的 i18n 國際化支援**（中文、英文、泰文）
   - 無障礙功能和鍵盤導航支援

## 🚀 開始實作

此任務將分階段實施，確保每個階段都能獨立測試和驗證，最終交付一個完整且穩定的狀態篩選功能。