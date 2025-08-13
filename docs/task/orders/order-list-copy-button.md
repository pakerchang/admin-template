# Order List 複製按鈕功能需求

## 功能概述
在 Order List 頁面的表格中新增複製按鈕，允許使用者複製單筆訂單的詳細資訊。

## 功能需求

### 1. UI 設計
- 在 Order List 表格的 Actions 欄位中新增複製按鈕
- 複製按鈕應使用適當的圖示（建議使用 `Copy` 或 `Clipboard` 圖示）
- 按鈕樣式應與現有的 EditActions 組件保持一致

### 2. 複製功能
- 點擊複製按鈕時，將該筆訂單的資訊複製到剪貼簿
- 複製成功後應顯示 toast 提示訊息（支援 i18n）
- 複製失敗時也應顯示 toast 錯誤訊息（支援 i18n）

### 3. 複製內容格式
複製的內容應按照以下格式輸出：

```
訂單編號: ORDER_001
代理商編號: AGENT_123
備註: 客戶要求快速出貨
訂單狀態: 待處理
建立時間: 2024-01-15 10:30
更新時間: 2024-01-15 14:20
```

### 4. 格式規範
- 使用 i18n 翻譯的欄位名稱作為 key
- 格式：`{key name(i18n)}: {value}`
- 每個欄位佔一行，使用 `\n` 換行
- **注意：order detail 內容暫不包含在複製內容中**

### 5. 技術實作要點

#### 5.1 涉及檔案
- `src/pages/orders/OrderList.tsx` - 主要修改檔案
- `src/components/shared/EditActions.tsx` - 可能需要擴展
- `src/locales/` - 可能需要新增翻譯

#### 5.2 實作步驟
1. 在 EditActions 組件中新增複製按鈕選項
2. 實作複製邏輯函數
3. 整合到 OrderList 的 actions 欄位
4. 新增適當的 i18n 翻譯（包含複製成功和失敗訊息）
5. 整合 toast 訊息系統顯示複製狀態

#### 5.3 欄位對應
需要複製的欄位及其 i18n key：
- `order_id` → `table.headers.order.orderId`
- `agent_id` → `table.headers.order.agentId`
- `remark` → `table.headers.order.remark`
- `order_status` → `table.headers.order.status`
- `created_at` → `table.headers.createdAt`
- `updated_at` → `table.headers.updatedAt`

#### 5.4 技術考慮
- 使用 `navigator.clipboard.writeText()` API 進行複製
- 需要處理複製失敗的錯誤情況
- 考慮瀏覽器相容性
- 使用 toast 組件顯示複製狀態（成功/失敗）
- 所有 toast 訊息都需要支援 i18n 翻譯

#### 5.5 i18n 翻譯需求
需要新增的翻譯 key：
- `actions.copy` - 複製按鈕 tooltip
- `messages.copySuccess` - 複製成功訊息
- `messages.copyFailed` - 複製失敗訊息

### 6. 使用者體驗
- 複製按鈕應有適當的 hover 效果
- 點擊後應有視覺回饋（如短暫變色或動畫）
- 複製成功時顯示綠色成功 toast 訊息
- 複製失敗時顯示紅色錯誤 toast 訊息
- 按鈕應有適當的 tooltip 說明功能（支援 i18n）
- Toast 訊息應自動消失（建議 3-5 秒）

### 7. 測試要求
- 測試各種訂單狀態的複製功能
- 測試複製內容的格式正確性
- 測試 i18n 翻譯的正確顯示（按鈕 tooltip 和 toast 訊息）
- 測試複製成功時的 toast 提示
- 測試複製失敗時的 toast 錯誤訊息
- 測試 toast 訊息的自動消失功能
- 測試不同瀏覽器的相容性

## 驗收標準
1. ✅ 複製按鈕正確顯示在 Actions 欄位中
2. ✅ 點擊複製按鈕能成功複製訂單資訊到剪貼簿
3. ✅ 複製的內容格式符合需求規範
4. ✅ 使用正確的 i18n 翻譯作為欄位名稱
5. ✅ 複製成功後顯示 i18n 支援的綠色 toast 成功訊息
6. ✅ 複製失敗時顯示 i18n 支援的紅色 toast 錯誤訊息
7. ✅ Toast 訊息能自動消失
8. ✅ 按鈕 tooltip 支援 i18n 翻譯
9. ✅ 錯誤處理機制正常運作
10. ✅ UI 樣式與現有組件保持一致

## 優先級
**中等優先級** - 此功能為便利性功能，可提升使用者操作效率

## 預估工時
約 4-6 小時（包含開發、測試、調整）

## 備註
- 此功能不包含 order_detail 陣列內容的複製
- 複製格式應保持簡潔易讀
- 可考慮未來擴展為可選擇性複製特定欄位的功能