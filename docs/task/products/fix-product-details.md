# 🔧 Product Form 資料處理與驗證重構修復工程文件

**Issue:** #26  
**修復範圍:** ProductForm 資料載入、驗證邏輯與狀態管理重構  
**預估工作量:** 4-5 個工作階段

## 📋 確認的問題

### 🎯 **核心問題分析**

#### **問題 1: 編輯模式資料載入異常**
- **現象**: 編輯商品時資料無法正確引入頁面欄位
- **根因**: 
  - API 回應結構不一致處理邏輯複雜
  - 表單初始化採用兩階段模式（預設值 → reset），造成競態條件
  - 資料型別轉換邏輯不穩定（字串 ↔ 數值）

#### **問題 2: 驗證觸發時機不當**
- **現象**: 資料引入時錯誤觸發欄位驗證，產生誤報錯誤
- **根因**:
  - 使用 `mode: "onChange"` 過度激進的驗證策略
  - 編輯和創建模式使用相同的嚴格驗證規則
  - 多語言欄位驗證在資料預填時產生衝突

#### **問題 3: 表單狀態管理混亂**
- **現象**: 提交按鈕的啟用/禁用邏輯不符預期
- **根因**:
  - 創建模式未實現「必填欄位有值時解鎖 submit」邏輯
  - 編輯模式未檢查表單有效性，只依賴 `isDirty`
  - 狀態依賴過多導致重複渲染和邏輯複雜

## 🏗️ 階段性修復分工

### **階段 1: 資料載入邏輯重構**
**目標:** 修復編輯模式資料載入和預填問題  
**預估時間:** 1.5 工作階段

**工作項目:**
- [ ] 重構 `ProductForm.tsx` 中的資料預填邏輯
- [ ] 優化 API 資料結構處理，統一陣列 → 單一物件轉換
- [ ] 修復數值型別轉換邏輯 (`product_price`, `product_size`)
- [ ] 改善 `tagInputs` 欄位的資料轉換邏輯
- [ ] 移除雙階段表單初始化，改為直接初始化

**完成標準:**
- 編輯模式進入時資料能正確預填到所有欄位
- 不再出現初始化時的閃爍或空白狀態
- 型別轉換穩定可靠，無數值異常

**檔案異動:**
- `src/pages/product/ProductForm.tsx` (第 94-122 行)
- `src/pages/product/hooks/use-product.ts` (如需要)

**Commit 格式:** `fix: #26 resolve product form data loading and prefill issues`

---

### **階段 2: 驗證邏輯階段化重構**
**目標:** 實現創建/編輯模式的差異化驗證策略  
**預估時間:** 2 工作階段

**工作項目:**
- [ ] 建立 `useProductSchema` hook，支援模式參數
- [ ] 實現創建模式的階段性驗證邏輯
- [ ] 實現編輯模式的寬鬆驗證規則
- [ ] 修改表單驗證模式從 `onChange` 改為 `onBlur`
- [ ] 優化多語言欄位的驗證規則

**完成標準:**
- 創建模式：必填欄位有值時表單標記為 `isDirty`
- 編輯模式：只對真正修改的欄位進行驗證
- 驗證錯誤只在適當時機顯示（失焦後）
- 多語言欄位驗證不會誤報

**檔案異動:**
- `src/pages/product/hooks/use-product.ts` (第 281-372 行)
- `src/pages/product/ProductForm.tsx` (第 112-122 行)

**Commit 格式:** `refactor: #26 implement staged validation for create and edit modes`

---

### **階段 3: 提交按鈕狀態邏輯重構**
**目標:** 實現符合需求的提交按鈕控制邏輯  
**預估時間:** 1 工作階段

**工作項目:**
- [ ] 重構創建模式提交按鈕邏輯：必填欄位完成 → 解鎖
- [ ] 重構編輯模式提交按鈕邏輯：有變更且有效 → 解鎖
- [ ] 簡化 `isCreateModeDisabled` 和 `isEditModeDisabled` 邏輯
- [ ] 移除重複的驗證檢查
- [ ] 優化 useMemo 依賴項，減少不必要重新計算

**完成標準:**
- 創建模式：所有必填欄位有值時 submit 按鈕啟用
- 點擊 submit 時才進行格式規範驗證
- 編輯模式：有異動且通過驗證時 submit 按鈕啟用
- 按鈕狀態變化流暢，無閃爍現象

**檔案異動:**
- `src/pages/product/ProductForm.tsx` (第 176-199 行)

**Commit 格式:** `refactor: #26 optimize submit button state management logic`

---

### **階段 4: 圖片上傳狀態同步優化**
**目標:** 修復圖片上傳與表單狀態同步問題  
**預估時間:** 0.5 工作階段

**工作項目:**
- [ ] 優化圖片上傳狀態更新邏輯
- [ ] 移除不必要的陣列複製操作
- [ ] 確保圖片異動正確觸發表單 `isDirty` 狀態
- [ ] 加強圖片上傳的錯誤處理

**完成標準:**
- 圖片上傳/刪除正確反映在表單狀態中
- 編輯模式下圖片異動能正確啟用 submit 按鈕
- 圖片相關操作不會造成表單驗證異常

**檔案異動:**
- `src/pages/product/ProductForm.tsx` (第 124-129 行)

**Commit 格式:** `fix: #26 resolve image upload state synchronization issues`

---

### **階段 5: 整合測試與用戶體驗優化**
**目標:** 確保所有修復功能正常運作，提升整體用戶體驗  
**預估時間:** 1 工作階段

**工作項目:**
- [ ] 進行完整的創建商品流程測試
- [ ] 進行完整的編輯商品流程測試
- [ ] 驗證所有驗證規則是否按預期運作
- [ ] 確認提交按鈕在各種情境下的正確行為
- [ ] 優化載入狀態和錯誤訊息顯示
- [ ] 執行 TypeScript、ESLint 檢查

**完成標準:**
- 創建商品：必填欄位 → 解鎖 submit → 點擊驗證 → 成功提交
- 編輯商品：正確載入 → 修改欄位 → 解鎖 submit → 驗證 → 更新成功
- 無 TypeScript 錯誤，通過 ESLint 檢查
- 用戶體驗流暢，錯誤提示清晰

**檔案異動:**
- 所有相關檔案的最終調整

**Commit 格式:** `test: #26 comprehensive product form functionality verification`

---

## 🔍 技術實現細節

### **關鍵修復策略**

#### **1. 資料預填邏輯重構**
```typescript
// 修復前：複雜且不可靠的處理邏輯
const data = useMemo((): TProductForm => {
  if (!isEditMode || !productData) return DEFAULT_VALUES
  const firstProduct = Array.isArray(productData) ? R.head(productData) : productData
  // ... 複雜的轉換邏輯
}, [isEditMode, productData])

// 修復後：明確且穩定的處理邏輯
const data = useMemo((): TProductForm => {
  if (!isEditMode || !productData || !Array.isArray(productData) || productData.length === 0) {
    return DEFAULT_VALUES
  }
  
  const product = productData[0] // 明確處理陣列結構
  return transformProductToFormData(product) // 專用轉換函數
}, [isEditMode, productData])
```

#### **2. 階段性驗證實現**
```typescript
// 創建模式：階段性驗證
const createModeValidation = {
  stage1: requiredFieldsCheck, // 必填欄位檢查
  stage2: formatValidation,    // 格式驗證（點擊 submit 時）
}

// 編輯模式：差異化驗證
const editModeValidation = {
  onlyChangedFields: true,     // 只驗證修改過的欄位
  relaxedRules: true,          // 較寬鬆的驗證規則
}
```

#### **3. 提交按鈕狀態統一邏輯**
```typescript
const isSubmitDisabled = useMemo(() => {
  const baseDisabled = isCreateUploading || isEditUpdating
  
  if (isEditMode) {
    return baseDisabled || !form.formState.isDirty || !form.formState.isValid
  }
  
  // 創建模式：必填欄位完成檢查
  return baseDisabled || !areRequiredFieldsFilled(form.watch())
}, [isEditMode, isCreateUploading, isEditUpdating, form.formState])
```

## 📝 Review 檢查清單

每個階段完成後，請確認以下項目：

### **功能驗證**
- [ ] 資料載入正確，無預填失敗情況
- [ ] 驗證觸發時機符合預期
- [ ] 提交按鈕狀態變化邏輯正確
- [ ] 創建/編輯流程完整可用

### **程式碼品質**
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查通過
- [ ] 無 console.log 或調試程式碼
- [ ] 程式碼邏輯清晰，註解適當

### **用戶體驗**
- [ ] 載入狀態適當顯示
- [ ] 錯誤訊息清晰友善
- [ ] 操作流程順暢直觀
- [ ] 響應式設計正常

### **測試覆蓋**
- [ ] 手動測試創建商品完整流程
- [ ] 手動測試編輯商品完整流程
- [ ] 邊界情況測試（空資料、網路錯誤等）
- [ ] 多語言切換測試

## 🚀 執行注意事項

1. **階段性執行**: 每個階段必須完全完成並通過 review 才能進入下一階段
2. **Commit 規範**: 嚴格遵循 `fix/refactor/test: #26 <description>` 格式
3. **備份策略**: 每階段開始前建立分支備份
4. **測試優先**: 每次修改後立即進行相關測試
5. **文件更新**: 如有 API 變更需同步更新相關文件

## 📞 緊急聯絡與決策

如遇到以下情況需要停止並詢問：
- **API 結構變更需求**: 如需修改後端 API 結構
- **業務邏輯疑問**: 對驗證規則或業務流程有疑問
- **技術架構調整**: 需要大幅修改現有架構
- **第三方依賴問題**: 遇到庫版本或相容性問題

---

**準備開始第一階段修復嗎？請確認後我將開始執行資料載入邏輯重構。**