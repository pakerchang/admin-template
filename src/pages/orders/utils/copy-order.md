# 訂單複製工具使用說明

這個模組提供了多種方式來複製訂單資訊到剪貼簿，使用了 **Ramda** 和 **react-use** 來提供函數式程式設計和 React Hook 的支援。

## 可用的函數和 Hook

### 1. 基本複製函數 (原始版本)

```typescript
import { copyOrderToClipboard } from "./copy-order";
import { getOrderStatusText } from "./order-status";

// 使用方式
const success = await copyOrderToClipboard(order, t, getOrderStatusText);
if (success) {
  toast.success("複製成功!");
}
```

### 2. 使用 Ramda 的函數式版本

```typescript
import { buildOrderCopyContent, processOrderForCopy } from "./copy-order";
import { getOrderStatusText } from "./order-status";

// Curry 函數版本 - 可以部分應用
const buildWithStatus = buildOrderCopyContent(getOrderStatusText);
const buildWithTranslation = buildWithStatus(t);
const content = buildWithTranslation(order);

// 管道版本 - 組合式處理
const content = processOrderForCopy({
  order,
  t,
  getOrderStatusText,
});
```

### 3. 使用 react-use 的 Hook 版本

```typescript
import { useCopyOrderToClipboard } from "../hooks/use-copy-order";

function OrderComponent({ order }) {
  const { copyOrder, state, isSuccess, isError } = useCopyOrderToClipboard();

  const handleCopy = async () => {
    await copyOrder(order);
  };

  return (
    <button onClick={handleCopy}>
      {isSuccess && "✅ 已複製"}
      {isError && "❌ 複製失敗"}
      {!isSuccess && !isError && "📋 複製訂單"}
    </button>
  );
}
```

## 複製內容格式

複製的內容包含以下資訊：

```
訂單編號: ORD123456
代理商: agent001
備註: 客戶要求快速配送
狀態: 待處理
總金額: 1500
建立時間: 2024-01-15 10:30
更新時間: 2024-01-15 11:00

訂單明細:
品項 1:
  商品名稱: 產品A
  商品ID: PROD001
  數量: 2
  價格: 500
  折扣備註: 會員優惠

品項 2:
  商品名稱: 產品B
  商品ID: PROD002
  數量: 1
  價格: 500

聯絡資訊:
  Email: customer@example.com
  電話: 0912345678
  地址: 台北市中正區...
```

## 使用的函式庫特性

### Ramda 函數

- `R.pipe` - 建立處理管道
- `R.filter(Boolean)` - 過濾掉 null/undefined 值
- `R.flatten` - 平坦化嵌套陣列
- `R.join('\\n')` - 用換行符連接陣列
- `R.curry` - 建立可部分應用的函數
- `R.trim` - 移除頭尾空白

### react-use Hook

- `useCopyToClipboard` - 提供複製到剪貼簿的功能和狀態追蹤

## 好處

1. **函數式設計**: 使用 Ramda 讓資料轉換更清晰和可組合
2. **型別安全**: 完整的 TypeScript 支援
3. **可測試性**: 純函數容易進行單元測試
4. **彈性**: 提供多種使用方式滿足不同需求
5. **狀態管理**: react-use 提供複製狀態的追蹤
