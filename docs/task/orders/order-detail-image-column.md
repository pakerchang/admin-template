# Order Detail Data Fields Enhancement

## 概述

為 order-detail 頁面更新所有新的資料欄位，包括：
1. 商品 table 新增 image column 和 discount_remark column
2. InfoCard 新增 ship_remark 和 ship_time 欄位
3. 更新資料 schema 以支援新的 API 響應格式

## 背景

API 響應格式已更新，新增了多個欄位需要在 UI 上對應顯示：
- `product_images`: 商品圖片陣列（顯示在商品 table）
- `discount_remark`: 折扣備註（顯示在商品 table）  
- `ship_remark`: 配送備註（顯示在 InfoCard 的 shipping 區塊）
- `ship_time`: 配送時間（顯示在 InfoCard 的 shipping 區塊）

## 新的 API 響應格式

```json
{
  "code": 0,
  "data": [
    {
      "agent_id": "string",
      "contact_info": {
        "address": "string",
        "email": "string", 
        "phone": "string"
      },
      "created_at": "string",
      "order_detail": [
        {
          "discount_remark": "string",
          "order_id": "string",
          "price": "string",
          "product_id": "string",
          "product_images": [
            {
              "file_name": "string",
              "file_url": "string"
            }
          ],
          "product_name": "string",
          "size": "string"
        }
      ],
      "order_id": "string",
      "order_status": "pending",
      "remark": "string",
      "ship_fee": "string",
      "ship_remark": "string", 
      "ship_time": "string",
      "total_order_fee": "string",
      "updated_at": "string",
      "user_id": "string"
    }
  ],
  "error": "string",
  "msg": "string",
  "total": 0
}
```

## 開發任務

### 1. 更新 Schema 定義

**檔案**: `src/services/contacts/orders.ts`

需要更新的 Schema:
- `orderItemSchema`: 新增 `product_images` 和 `discount_remark` 欄位
- `baseOrderSchema`: 新增 `ship_remark` 和 `ship_time` 欄位

#### 具體更新內容:

```typescript
// 新增圖片 schema
export const productImageSchema = z.object({
  file_name: z.string(),
  file_url: z.string(),
})

export type TProductImage = z.infer<typeof productImageSchema>

// 更新 orderItemSchema
export const orderItemSchema = z.object({
  product_name: z.string(),
  product_id: z.string(),
  size: z.string(),
  price: z.string(),
  order_id: z.string(),
  discount_remark: z.string(),
  product_images: z.array(productImageSchema),
})

// 更新 baseOrderSchema
export const baseOrderSchema = z.object({
  agent_id: z.string(),
  order_id: z.string(),
  order_detail: z.array(orderItemSchema),
  order_status: orderStatusSchema,
  contact_info: contactInfoSchema,
  remark: z.string(),
  ship_fee: z.string(),
  ship_remark: z.string(),
  ship_time: z.string(),
  total_order_fee: z.string(),
  user_id: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})
```

### 2. 更新 OrderItem 組件

**檔案**: `src/pages/orders/order-details/components/OrderItem.tsx`

#### 需要新增的功能:
1. 新增 Image column 在 table 中（建議放在第一欄）
2. 新增 Discount Remark column 在 table 中
3. 圖片顯示邏輯：
   - 如果 `product_images` 陣列有資料，顯示第一張圖片
   - 如果 `product_images` 陣列為空，顯示 "-"
4. 折扣備註顯示邏輯：
   - 顯示 `discount_remark` 內容
   - 如果為空字串，顯示 "-"

#### 新增 Column 規格:

**Image Column:**
```typescript
{
  accessorKey: "product_images",
  enableHiding: false,
  header: () => (
    <h4 className="text-lg font-bold">
      {t("pages.order.orderDetails.orderItem.image")}
    </h4>
  ),
  cell: ({ row }) => {
    const images = row.getValue("product_images") as TProductImage[]
    
    if (!images || images.length === 0) {
      return <p className="text-center text-gray-400">-</p>
    }
    
    return (
      <div className="flex justify-center">
        <img 
          src={images[0].file_url} 
          alt={images[0].file_name}
          className="h-16 w-16 rounded-lg object-cover"
        />
      </div>
    )
  },
}
```

**Discount Remark Column:**
```typescript
{
  accessorKey: "discount_remark",
  enableHiding: false,
  header: () => (
    <h4 className="text-lg font-bold">
      {t("pages.order.orderDetails.orderItem.discountRemark")}
    </h4>
  ),
  cell: ({ row }) => {
    const remark = row.getValue("discount_remark") as string
    return (
      <p className="text-center">
        {remark || "-"}
      </p>
    )
  },
}
```

### 3. 更新 InfoCard 組件

**檔案**: `src/pages/orders/order-details/components/InfoCard.tsx`

#### 需要新增的功能:
在 Shipping 區塊新增兩個欄位：
1. `ship_remark`: 配送備註
2. `ship_time`: 配送時間

#### InfoCard Props 更新:
```typescript
type IInfoCardProps = Pick<
  TOrder,
  "created_at" | "updated_at" | "ship_fee" | "ship_remark" | "ship_time" | "order_status" | "contact_info"
>
```

#### Shipping 區塊新增內容:
```typescript
// 在現有的 shipping 區塊中新增
<div className="flex flex-1 items-center justify-between">
  <p className="text-gray-400">
    {t("pages.order.orderDetails.shipping.shippingTime")}
  </p>
  <p className="text-end">{ship_time || "-"}</p>
</div>

<div className="flex flex-1 items-center justify-between">
  <p className="text-gray-400">
    {t("pages.order.orderDetails.shipping.shippingRemark")}
  </p>
  <p className="text-end">{ship_remark || "-"}</p>
</div>
```

### 4. 更新翻譯檔案

需要在翻譯檔案中新增所有新欄位的翻譯：

**中文**: `src/locales/zh/translation.json`
```json
{
  "pages.order.orderDetails.orderItem.image": "商品圖片",
  "pages.order.orderDetails.orderItem.discountRemark": "折扣備註",
  "pages.order.orderDetails.shipping.shippingTime": "配送時間",
  "pages.order.orderDetails.shipping.shippingRemark": "配送備註"
}
```

**英文**: `src/locales/en/translation.json`
```json
{
  "pages.order.orderDetails.orderItem.image": "Product Image",
  "pages.order.orderDetails.orderItem.discountRemark": "Discount Remark",
  "pages.order.orderDetails.shipping.shippingTime": "Shipping Time",
  "pages.order.orderDetails.shipping.shippingRemark": "Shipping Remark"
}
```

**泰文**: `src/locales/th/translation.json`
```json
{
  "pages.order.orderDetails.orderItem.image": "รูปภาพสินค้า",
  "pages.order.orderDetails.orderItem.discountRemark": "หมายเหตุส่วนลด",
  "pages.order.orderDetails.shipping.shippingTime": "เวลาจัดส่ง",
  "pages.order.orderDetails.shipping.shippingRemark": "หมายเหตุการจัดส่ง"
}
```

## 實作步驟

### Phase 1: Schema 更新
1. 更新 `src/services/contacts/orders.ts` 中的 schema 定義
2. 確保類型定義正確導出

### Phase 2: OrderItem 組件更新
1. 更新 `OrderItem.tsx` 組件，新增 image column 和 discount_remark column
2. 實作圖片顯示邏輯
3. 調整 table column 順序（建議將圖片放在第一欄）

### Phase 3: InfoCard 組件更新
1. 更新 `InfoCard.tsx` 組件 Props 類型定義
2. 在 Shipping 區塊新增 ship_time 和 ship_remark 欄位
3. 更新父組件傳遞新的 props

### Phase 4: 翻譯更新
1. 在三個語言的翻譯檔案中新增所有新欄位的對應翻譯

### Phase 5: 測試驗證
1. 確認 schema 更新後不會導致類型錯誤
2. 測試圖片顯示功能
3. 測試所有新欄位的顯示效果
4. 測試空值情況下的顯示效果（顯示 "-"）
5. 確認響應式設計在不同螢幕尺寸下的表現

## 技術考慮

### 圖片載入處理
- 考慮新增 loading state
- 處理圖片載入失敗的情況
- 可能需要新增 placeholder 圖片

### 效能優化
- 考慮使用 lazy loading
- 圖片尺寸優化

### 錯誤處理
- 圖片 URL 無效時的備用方案
- 網路錯誤時的顯示效果

## 檔案清單

需要修改的檔案：
1. `src/services/contacts/orders.ts` - Schema 定義
2. `src/pages/orders/order-details/components/OrderItem.tsx` - 商品列表組件
3. `src/pages/orders/order-details/components/InfoCard.tsx` - 訂單資訊卡片組件
4. `src/pages/orders/order-details/index.tsx` - 父組件（傳遞新 props）
5. `src/locales/zh/translation.json` - 中文翻譯
6. `src/locales/en/translation.json` - 英文翻譯
7. `src/locales/th/translation.json` - 泰文翻譯

## 驗收標準

1. ✅ Schema 更新完成，支援新的 API 響應格式
2. ✅ OrderItem 組件成功新增 image column 和 discount_remark column
3. ✅ 圖片正確顯示（有圖片時顯示第一張，無圖片時顯示 "-"）
4. ✅ InfoCard 組件成功新增 ship_time 和 ship_remark 欄位
5. ✅ 所有新欄位在空值時正確顯示 "-"
6. ✅ 翻譯檔案更新完成，包含所有新欄位
7. ✅ 無 TypeScript 類型錯誤
8. ✅ UI 響應式設計正常運作
9. ✅ 圖片載入和錯誤處理正常

## 預估工作時間

- Schema 更新: 0.5 小時
- OrderItem 組件開發: 1 小時
- InfoCard 組件開發: 0.5 小時
- 父組件更新: 0.5 小時
- 翻譯更新: 0.5 小時
- 測試驗證: 0.5 小時

**總計**: 3.5 小時

## 風險評估

### 低風險
- Schema 更新相對簡單
- 現有組件結構支援新增欄位

### 中風險
- 圖片載入可能影響頁面效能
- 不同圖片尺寸可能影響 table 排版

### 緩解措施
- 使用適當的圖片尺寸限制
- 實作錯誤處理機制
- 充分測試不同資料情況