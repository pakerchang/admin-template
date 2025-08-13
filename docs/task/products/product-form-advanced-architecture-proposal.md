# ProductForm 進階架構提案

## 📋 文件資訊

- **功能名稱**: ProductForm 三層架構進階重構
- **需求編號**: PROPOSAL-PRODUCT-FORM-ADVANCED-001  
- **建立日期**: 2025-07-13
- **專案**: Admin Dashboard
- **文件版本**: v1.0
- **狀態**: 提案/未來實作
- **依賴關係**: 
  - 前置需求：完成基礎三表單拆分 (REQ-PRODUCT-FORM-REFACTOR-001)

## 🎯 提案概述

這是一個針對 ProductForm 的進階三層架構設計，在完成基礎三表單拆分後，可進一步優化為更清晰的分層架構。

### 核心理念

**關注點完全分離**：
- 驗證層專注於資料驗證規則
- 表單結構層專注於業務邏輯組織
- UI 元件層專注於純渲染邏輯

**真正的模組化**：
- 每一層都可以獨立開發、測試、維護
- 清晰的相依性方向：表單結構層 → 驗證層 + UI 元件層
- 完全避免循環相依

## 🏗️ 三層架構設計

```
產品表單架構
├── 驗證層 (Validation Layer)
│   ├── schemas/
│   │   ├── create-product.schema.ts      # 新增商品驗證規則
│   │   ├── edit-product.schema.ts        # 編輯商品驗證規則
│   │   └── draft-product.schema.ts       # 草稿商品驗證規則
│   │
├── 表單結構層 (Form Structure Layer)
│   ├── ProductCreateForm.tsx             # 組合 UI 元件 + create schema
│   ├── ProductEditForm.tsx               # 組合 UI 元件 + edit schema
│   └── ProductDraftForm.tsx              # 組合 UI 元件 + draft schema
│
└── UI 元件層 (UI Components Layer)
    └── form-fields/
        ├── ProductBasicFields.tsx        # 基本資訊欄位群組
        ├── ProductMultiLangFields.tsx    # 多語言欄位群組
        ├── ProductImageUpload.tsx        # 圖片上傳功能
        ├── ProductSelectFields.tsx       # 下拉選單欄位群組
        └── ProductStatusFields.tsx       # 狀態相關欄位
```

## 📐 各層職責定義

### 1. 驗證層 (Validation Layer)

**職責**：
- 定義各模式的資料驗證規則
- 提供型別安全的 schema
- 集中管理驗證邏輯

**範例實作**：
```typescript
// schemas/create-product.schema.ts
import { z } from 'zod'

export const createProductSchema = z.object({
  product_name: z.string().min(1, "商品名稱必填"),
  price: z.number().positive("價格必須大於 0"),
  stock: z.number().min(0, "庫存不能為負數"),
  status: z.enum(['active', 'inactive']),
  // ... 其他欄位
})

export type CreateProductFormData = z.infer<typeof createProductSchema>
```

```typescript
// schemas/edit-product.schema.ts
import { z } from 'zod'

export const editProductSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1, "商品名稱必填"),
  price: z.number().positive("價格必須大於 0"),
  // 編輯模式可能有不同的驗證規則
  // 例如：某些欄位不可編輯
})

export type EditProductFormData = z.infer<typeof editProductSchema>
```

### 2. UI 元件層 (UI Components Layer)

**職責**：
- 純 UI 渲染，不包含業務邏輯
- 接受 form 實例，處理欄位互動
- 可重用的欄位群組元件

**範例實作**：
```typescript
// form-fields/ProductBasicFields.tsx
interface ProductBasicFieldsProps {
  form: UseFormReturn<any>
  disabled?: boolean
}

export function ProductBasicFields({ form, disabled = false }: ProductBasicFieldsProps) {
  return (
    <Paper>
      <h3>基本資訊</h3>
      <FormField
        control={form.control}
        name="product_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>商品名稱</FormLabel>
            <FormControl>
              <Input {...field} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>價格</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                type="number" 
                disabled={disabled}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* 其他基本欄位 */}
    </Paper>
  )
}
```

```typescript
// form-fields/ProductMultiLangFields.tsx
export function ProductMultiLangFields({ form, disabled = false }) {
  const languages = ['zh', 'en', 'th'] as const
  
  return (
    <Paper>
      <h3>多語言資訊</h3>
      {languages.map((lang) => (
        <div key={lang}>
          <h4>{getLanguageName(lang)}</h4>
          <FormField
            control={form.control}
            name={`description_${lang}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>商品描述 ({lang.toUpperCase()})</FormLabel>
                <FormControl>
                  <Textarea {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </Paper>
  )
}
```

### 3. 表單結構層 (Form Structure Layer)

**職責**：
- 組合 UI 元件和驗證 schema
- 處理表單提交和業務邏輯
- 管理表單狀態和生命週期

**範例實作**：
```typescript
// ProductCreateForm.tsx
import { createProductSchema, type CreateProductFormData } from './schemas/create-product.schema'
import { ProductBasicFields } from './form-fields/ProductBasicFields'
import { ProductMultiLangFields } from './form-fields/ProductMultiLangFields'
import { ProductImageUpload } from './form-fields/ProductImageUpload'

export function ProductCreateForm() {
  const form = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      product_name: '',
      price: 0,
      status: 'inactive',
      // ... 其他預設值
    }
  })

  const createMutation = useCreateProduct()

  const onSubmit = (data: CreateProductFormData) => {
    const transformedData = transformCreateFormData(data)
    createMutation.mutate(transformedData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <h1>新增商品</h1>
        
        <ProductBasicFields form={form} />
        <ProductMultiLangFields form={form} />
        <ProductImageUpload form={form} />
        
        <Button type="submit" disabled={!form.formState.isValid}>
          新增商品
        </Button>
      </form>
    </Form>
  )
}
```

```typescript
// ProductEditForm.tsx
import { editProductSchema, type EditProductFormData } from './schemas/edit-product.schema'

export function ProductEditForm() {
  const { id } = useParams()
  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
  })

  // 載入商品資料
  const { data: productData, isLoading } = useGetProduct(id)
  const updateMutation = useUpdateProduct()

  useEffect(() => {
    if (productData) {
      form.reset(transformProductToFormData(productData))
    }
  }, [productData])

  const onSubmit = (data: EditProductFormData) => {
    const transformedData = transformEditFormData(data)
    updateMutation.mutate({ id, data: transformedData })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <h1>編輯商品</h1>
        
        <ProductBasicFields form={form} disabled={isLoading} />
        <ProductMultiLangFields form={form} disabled={isLoading} />
        <ProductImageUpload form={form} disabled={isLoading} />
        
        <Button 
          type="submit" 
          disabled={!form.formState.isDirty || !form.formState.isValid}
        >
          更新商品
        </Button>
      </form>
    </Form>
  )
}
```

## 🎯 架構優勢

### 1. **完全的關注點分離**
- 修改驗證規則只需修改 schema 檔案
- 調整 UI 只需修改對應的 UI 元件
- 表單邏輯變更只影響表單結構層

### 2. **極高的可重用性**
- UI 元件可以在不同表單間重用
- Schema 可以被其他功能引用
- 減少重複程式碼

### 3. **優秀的測試性**
- 每一層都可以獨立測試
- UI 元件測試專注於渲染邏輯
- Schema 測試專注於驗證邏輯
- 表單測試專注於整合邏輯

### 4. **清晰的開發分工**
- 後端開發者可專注於 schema 設計
- UI/UX 開發者可專注於 UI 元件
- 前端開發者可專注於表單邏輯

### 5. **未來擴展性**
- 新增表單模式只需組合現有元件
- 修改 UI 設計不影響驗證邏輯
- 支援 A/B 測試和漸進式升級

## 📊 與當前方案的比較

| 方面 | 當前方案（三獨立表單） | 進階方案（三層架構） |
|------|-------------------|-------------------|
| 實作複雜度 | 低 | 中 |
| 程式碼重複 | 適度重複 | 最小化重複 |
| 維護成本 | 中 | 低 |
| 測試難度 | 中 | 低 |
| 擴展性 | 中 | 高 |
| 學習曲線 | 低 | 中 |

## 🚀 遷移策略

### Phase 1: 驗證層抽取
1. 從現有的三個獨立表單中抽取驗證邏輯
2. 建立對應的 schema 檔案
3. 更新表單使用新的 schema

### Phase 2: UI 元件層建立
1. 識別可重用的欄位群組
2. 建立對應的 UI 元件
3. 逐步替換表單中的重複程式碼

### Phase 3: 表單結構層重構
1. 簡化表單結構層的邏輯
2. 專注於組合和業務邏輯
3. 最佳化表單性能

## 💡 實作建議

### 1. **漸進式遷移**
- 先完成基礎三表單拆分
- 在功能穩定後再考慮進階架構
- 避免過早優化

### 2. **從最重複的部分開始**
- 優先抽取多語言欄位元件
- 再處理基本資訊欄位
- 最後處理複雜的業務邏輯

### 3. **保持向後相容**
- 確保 API 介面不變
- 維持現有的使用者體驗
- 支援平滑升級

## 📅 時程規劃

這個進階架構適合在以下時機實施：

1. **基礎重構完成後** - 確保三個獨立表單穩定運作
2. **有充足開發時間** - 預計需要 2-3 個開發週期
3. **團隊技能準備完成** - 團隊熟悉分層架構概念
4. **業務需求相對穩定** - 避免在需求變動期間重構

---

**文件狀態**: 提案
**建議時機**: 基礎重構完成後的下一個優化週期
**預期效益**: 大幅提升程式碼品質和可維護性