# 圖片驗證插件系統需求文檔

## 概述
本文檔描述通用圖片驗證插件系統的需求，該系統為整個應用提供可擴展的圖片驗證機制。系統採用插件架構設計，支援不同業務場景的客製化驗證需求，包含 Banner 圖片、商品圖片、用戶頭像等多種使用場景。

## 專案背景與演進

### 原始需求
- **起始目標**：Banner 圖片驗證增強
- **核心問題**：需要支援 WebP 格式、解析度驗證、檔案大小控制

### 需求演進
- **架構升級**：從 Banner 專屬 → 通用插件系統
- **設計模式**：採用插件架構 + 依賴注入模式
- **適用範圍**：所有圖片上傳功能（Banner、商品、頭像等）

## 系統目標

### 核心目標
1. **建立可擴展的插件架構** - 支援不同業務場景的驗證需求
2. **保持向後相容性** - 現有驗證邏輯不受影響
3. **實現依賴注入模式** - 動態載入和管理驗證規則
4. **支援多元化驗證場景** - Banner、商品、頭像等不同需求
5. **確保類型安全** - 使用 TypeScript + Zod 完整類型檢查
6. **國際化支援** - 多語言錯誤訊息

### 業務目標
1. **Banner 圖片優化** - 強制 WebP 格式，提升載入效能
2. **統一驗證體驗** - 所有圖片上傳使用一致的驗證流程
3. **開發效率提升** - 插件化設計降低維護成本
4. **未來擴展準備** - 為 AI 內容審核、自動優化等功能預留架構

## 插件系統架構

### 核心組件

#### 1. 插件介面定義
```typescript
interface ImageValidationRule {
  name: string
  priority?: number
  validate: (
    file: File,
    metadata?: ImageMetadata,
    context?: ValidationContext
  ) => Promise<ValidationResult>
}
```

#### 2. 驗證管理器
```typescript
interface IValidationManager {
  registerRule(rule: ImageValidationRule): void
  unregisterRule(ruleName: string): void
  validateImage(file: File, options?: ValidationOptions): Promise<BatchValidationResult>
  getRules(): ReadonlyArray<ImageValidationRule>
  clearRules(): void
  getAllowedFormats(context?: ValidationContext): { types: string[]; extensions: string[] }
}
```

#### 3. 驗證上下文
```typescript
interface ValidationContext {
  imageType?: 'desktop' | 'mobile'
  // 動態格式限制
  allowedTypes?: string[]
  allowedExtensions?: string[]
  enableWebPValidation?: boolean
  t?: (key: string, options?: Record<string, unknown>) => string
}
```

### 插件分類

#### 基礎驗證插件
1. **檔案類型驗證** (`file-type.rule.ts`)
   - 檢查 MIME 類型和副檔名
   - 支援 JPEG、PNG、WebP 格式

2. **檔名格式驗證** (`filename.rule.ts`)
   - 檔名字符限制：英文、數字、底線、連字符
   - 正則表達式：`/^[a-zA-Z0-9_-]+$/`

3. **檔名前綴驗證** (`filename-prefix.rule.ts`)
   - 桌面版：`d_` 前綴
   - 手機版：`m_` 前綴

#### 格式專屬插件
1. **WebP 格式驗證** (`webp.rule.ts`)
   - 寬鬆模式：建議使用 WebP（警告級別）
   - 嚴格模式：強制使用 WebP（錯誤級別）
   - Banner 專屬：強制 WebP 以提升效能

#### 品質控制插件
1. **解析度驗證** (`resolution/*.rule.ts`)
   - **桌面版 Banner**：
     - 建議：1920×1080 (16:9)
     - 最小：1280×720
     - 最大：3840×2160
     - 寬高比：16:9 (±5% 容許誤差)
   
   - **手機版 Banner**：
     - 支援比例：16:9
     - 範圍：640×360 ~ 1920×1080

2. **檔案大小驗證** (`filesize.rule.ts`)
   - 最小大小：1KB
   - 最大大小：桌面版 5MB，手機版 3MB
   - WebP 建議大小：
     - 桌面版：300KB-1.5MB
     - 手機版：150KB-800KB

## 業務場景預設配置

### Banner 圖片驗證 (已實現)
```typescript
function createBannerValidationManager(): IValidationManager {
  const manager = createValidationManager()
  
  const bannerRules = [
    bannerFileTypeRule,     // Banner 專用：WebP only (業務邏輯耦合點)
    filenameFormatRule,     // 檔名格式限制
    filenamePrefixRule,     // d_/m_ 前綴檢查
    desktopResolutionRule,  // 桌面版解析度限制
    mobileResolutionRule,   // 手機版解析度限制
    filesizeRule,           // 檔案大小限制
  ]

  bannerRules.forEach(rule => manager.registerRule(rule))
  
  return manager
}
```

### 通用圖片驗證 (商品、文章封面)
```typescript
function createGeneralImageValidationManager(): IValidationManager {
  const manager = createValidationManager()
  
  const generalRules = [
    fileTypeRule,        // 檔案類型：JPEG、PNG、WebP 支援
    filenameFormatRule,  // 檔名格式限制  
    filesizeRule,        // 基本檔案大小限制
  ]

  generalRules.forEach(rule => manager.registerRule(rule))
  
  return manager
}
```

**使用場景對照表：**

| 功能 | 驗證管理器 | 檔案格式 | 前綴要求 | 解析度驗證 | WebP 要求 |
|------|------------|----------|----------|------------|-----------|
| Banner | `createBannerValidationManager()` | WebP only | d_, m_ | ✅ 16:9 | ✅ 強制 |
| 商品圖片 | `createGeneralImageValidationManager()` | JPEG/PNG/WebP | ❌ 無 | ❌ 無 | ❌ 無 |
| 文章封面 | `createGeneralImageValidationManager()` | JPEG/PNG/WebP | ❌ 無 | ❌ 無 | ❌ 無 |

## UI 整合架構

### ImageUploadDialog 組件擴展
```typescript
interface IImageUploadProps {
  onUpload: (fileName: string, base64: string) => void
  error?: boolean
  filenameRules?: FilenameRule
  // 插件系統整合
  validationManager?: IValidationManager
  imageType?: ImageType
  enableWebPValidation?: boolean
}
```

### 關鍵特性
1. **動態格式檢測** - 從驗證插件獲取允許的檔案格式
2. **即時重新驗證** - 檔名修改時自動觸發驗證
3. **錯誤分級顯示** - 區分錯誤和警告
4. **國際化支援** - 支援中文、英文、泰文

## 實施進度

### ✅ 已完成階段

#### Phase 1: 基礎架構
- [x] 建立 `src/plugins/image-validation/` 目錄結構
- [x] 實作 `ValidationManager` 核心類別
- [x] 定義 Zod 類型安全 schemas
- [x] 建立插件介面和基礎架構
- [x] 整合 i18n 多語言支援

#### Phase 2: 插件規則實作
- [x] 基礎驗證插件（檔案類型、檔名格式、前綴檢查）
- [x] WebP 格式驗證插件（寬鬆/嚴格模式）
- [x] 解析度驗證插件（桌面版/手機版）
- [x] 檔案大小驗證插件
- [x] 依賴注入模式實現

#### Phase 3: UI 整合
- [x] 擴展 `ImageUploadDialog` 組件
- [x] 實作動態格式檢測 (`getAllowedFormats()`)
- [x] 檔名修改觸發重新驗證
- [x] Banner 嚴格模式整合
- [x] 錯誤訊息顯示優化

#### 關鍵問題解決
- [x] **問題 1**: 硬編碼格式 → 依賴注入動態格式
- [x] **問題 2**: 檔名修改未觸發驗證 → 即時重新驗證
- [x] **問題 3**: WebP 警告級別 → 強制錯誤級別

### 📋 實施進度

#### Phase 4: 業務場景擴展
- [x] **Phase 4.1: 建立通用圖片驗證管理器** - Completed on 2025-07-06
  - ✅ 實作內容：建立 `createGeneralImageValidationManager` 函式
  - ✅ 測試結果：所有單元測試通過 (10/10)
  - ✅ 檔案位置：`src/plugins/image-validation/presets/general.preset.ts`
  - ✅ 驗證規則：僅包含基礎驗證（檔案類型、檔名格式、檔案大小）
  - ✅ 特性：無前綴要求、無解析度限制、不強制 WebP
- [x] **Phase 4.2: 商品圖片驗證整合** - Completed on 2025-07-06
  - ✅ 實作內容：在 `ProductForm.tsx` 整合通用圖片驗證管理器
  - ✅ 驗證管理器：使用 `createGeneralImageValidationManager()` 建立實例
  - ✅ 整合方式：透過 `validationManager` prop 傳遞給 `ImageUploadDialog`
  - ✅ 特性：支援基礎驗證（檔案類型、檔名格式、檔案大小），無前綴或解析度限制
- [x] **Phase 4.3: 文章封面圖片驗證整合** - Completed on 2025-07-06
  - ✅ 實作內容：在 `ArticleForm.tsx` 整合通用圖片驗證管理器
  - ✅ 驗證管理器：使用 `createGeneralImageValidationManager()` 建立實例
  - ✅ 整合方式：透過 `validationManager` prop 傳遞給 `ImageUploadDialog`
  - ✅ 特性：支援基礎驗證（檔案類型、檔名格式、檔案大小），無前綴或解析度限制

#### 架構重構階段
- [x] **架構重構: 格式規範化與動態注入** - Completed on 2025-07-06
  - ✅ **問題識別**：`supportedTypes` 和 `supportedExtensions` 在每個規則中重複定義，造成不必要耦合
  - ✅ **解決方案**：集中式格式定義 + 動態格式注入機制
  - ✅ **核心變更**：
    - 建立 `src/plugins/image-validation/constants/supported-formats.ts` 集中格式定義
    - 更新 `file-type.rule.ts` 支援動態格式限制（優先使用 context 注入，否則使用預設）
    - 擴展 `ValidationContext` 和 `ValidationOptions` 支援 `allowedTypes` 和 `allowedExtensions`
    - 更新 `ValidationManager.getAllowedFormats()` 支援動態 context 參數
  - ✅ **Banner 業務邏輯重構**：
    - 移除 `createBannerValidationManager(strict)` 參數
    - 在 `banner.preset.ts` 中建立 `bannerFileTypeRule` 作為業務耦合點
    - 使用批次註冊方式提升程式碼可讀性
    - 將 `BANNER_VALIDATION_CONFIG` 從 export 變數改為 JSDoc 範例文檔
  - ✅ **測試更新**：將配置期望值移至測試檔案內部，確保測試獨立性
  - ✅ **架構優勢**：
    - 消除格式定義重複，提升可維護性
    - 支援動態格式限制注入，增強靈活性  
    - 業務邏輯集中在對應 preset 文件，職責清晰
    - 向後相容，不影響現有功能

- [x] **架構重構: 驗證管理器去耦與性能優化** - Completed on 2025-07-06
  - ✅ **問題識別**：`imageType` 和 `enableWebPValidation` 參數違反解耦原則，ImageUploadDialog 驗證觸發過於頻繁
  - ✅ **解決方案**：分離驗證管理器 + 優化驗證觸發機制
  - ✅ **核心變更**：
    - 分離 `createBannerValidationManager` 為 `createDesktopBannerValidationManager` 和 `createMobileBannerValidationManager`
    - 移除 `imageType` 和 `enableWebPValidation` 參數，實現真正解耦
    - 創建專用前綴驗證規則：`desktopFilenamePrefixRule` (d_) 和 `mobileFilenamePrefixRule` (m_)
    - 在 `ImageUploadDialog` 中添加錯誤訊息比較，避免重複渲染
    - 優化 submit 按鈕禁用邏輯，精確反映驗證狀態
    - 更新所有相關測試用例和文檔
  - ✅ **BannerForm 重構**：
    - 使用兩個獨立的驗證管理器 (`desktopValidationManager`, `mobileValidationManager`)
    - 移除所有硬編碼的 props (`filenameRules`, `imageType`, `enableWebPValidation`)
    - 簡化 `ImageUploadDialog` 使用方式，只需傳入對應的驗證管理器
  - ✅ **性能優化**：
    - 避免不必要的驗證觸發，減少重複操作
    - 錯誤訊息比較機制，防止相同錯誤重複設置
    - 優化表單狀態更新，提升用戶體驗
  - ✅ **架構優勢**：
    - 完全實現解耦設計，UI 組件無需知道驗證規則實現
    - 提升性能，減少不必要的重新渲染
    - 更好的可維護性和擴展性
    - 符合單一責任原則，職責分離清晰

#### Phase 5: 功能測試與驗證
- [x] **Phase 5.1: Banner 功能測試** - 桌面版/手機版圖片上傳完整流程 - Completed on 2025-07-06
  - ✅ **實測結果**：經過架構重構後，Banner 圖片驗證功能完全正常
  - ✅ **錯誤攔截**：檔案大小和解析度驗證正確攔截不符規範的圖片
  - ✅ **最小檔案限制**：已更新為 1KB，提供更靈活的檔案大小要求
  - ✅ **桌面版驗證**：WebP 強制、d_ 前綴、16:9 解析度、1KB-5MB 檔案大小
  - ✅ **手機版驗證**：WebP 強制、m_ 前綴、16:9 解析度、1KB-3MB 檔案大小
- [x] **Phase 5.2: 商品圖片測試** - 多格式圖片上傳驗證 - Completed on 2025-07-06
  - ✅ 實測結果：通用驗證管理器正常運作，支援 JPEG、PNG、WebP 格式
  - ✅ 特性：無前綴要求、無解析度限制、不強制 WebP
- [x] **Phase 5.3: 文章封面測試** - 一般圖片上傳驗證 - Completed on 2025-07-06
  - ✅ 實測結果：使用相同通用驗證管理器，功能正常
  - ✅ UI 一致性：與商品圖片使用相同界面和驗證邏輯
- [x] **Phase 5.4: 錯誤訊息測試** - 多語言錯誤顯示正確性 - Completed on 2025-07-06
  - ✅ 實測結果：中文、英文、泰文切換正常
  - ✅ 修復完成：補全英文和泰文缺失的驗證訊息翻譯
  - ✅ 驗證鍵值：`validation.image.prefix.desktop` 等訊息現已正確顯示

#### Phase 6: 架構優化與重構
- [x] **Phase 6.1: 驗證級別統一** - 所有驗證失敗統一為 error 級別 - Completed on 2025-07-06
  - ✅ **問題修復**：檔案大小和解析度驗證無法正常攔截違規圖片
  - ✅ **根因分析**：`warning` 級別不會攔截 submit，`imageType` 依賴導致驗證跳過
  - ✅ **解決方案**：所有驗證失敗改為 `error` 級別，移除 `imageType` 依賴
  - ✅ **測試確認**：600×600 8KB WebP 圖片現在會被正確攔截（解析度不符 + 檔案過小）

- [x] **Phase 6.2: 架構模組化重構** - Code Split 與業務邏輯分離 - Completed on 2025-07-06
  - ✅ **目錄重構**：
    - `rules/base` → `base-rules/` (基礎通用規則)
    - `banner.preset.ts` → `presets/banner/index.ts` (Banner 業務模組)
    - 創建 `presets/banner/` 完整業務模組目錄
  - ✅ **檔案分離**：
    - `presets/banner/file-type.rule.ts` - Banner WebP 強制驗證
    - `presets/banner/filename-prefix.rule.ts` - Banner 前綴驗證 (d_/m_)
    - `presets/banner/filesize.rule.ts` - Banner 專屬檔案大小驗證
    - `presets/banner/resolution.rule.ts` - Banner 解析度驗證 (16:9)
    - `presets/banner/rules.ts` - Banner 規則統一匯出
  - ✅ **依賴解耦**：
    - 移除 `imageType` 依賴，分離桌面版和手機版驗證管理器
    - 通用 `filesizeRule` 移至 `base-rules/`，專屬規則留在業務模組
    - 修正所有匯入路徑，確保架構一致性

- [x] **Phase 6.3: 未使用檔案清理** - 移除冗餘代碼 - Completed on 2025-07-06
  - ✅ **已移除檔案**：
    - `rules/format/webp.rule.ts` (功能已被 Banner 模組取代)
    - `rules/resolution/desktop.rule.ts` (整合至 Banner 模組)
    - `rules/resolution/mobile.rule.ts` (整合至 Banner 模組)
    - 空的 `rules/resolution/` 和 `rules/format/` 目錄
  - ✅ **匯出更新**：更新所有 `index.ts` 檔案移除已刪除規則的匯出
  - ✅ **編譯檢查**：ESLint 和 TypeScript 編譯無錯誤

- [x] **Phase 6.4: 檔案大小限制優化** - 統一最小檔案大小限制 - Completed on 2025-07-06
  - ✅ **需求調整**：將所有圖片驗證的最小檔案大小從 10KB 調整為 1KB
  - ✅ **程式碼更新**：
    - 更新 `base-rules/filesize.rule.ts` 最小限制為 1KB
    - 更新 `presets/banner/filesize.rule.ts` 桌面版和手機版最小限制為 1KB
  - ✅ **文檔同步**：
    - 更新 README.md 中所有檔案大小說明
    - 更新進度文檔中的規格說明
  - ✅ **測試確認**：Banner 圖片驗證功能完全正常，新的 1KB 限制運作良好
  - ✅ **i18n 兼容**：翻譯檔案使用動態變數，自動顯示正確的檔案大小限制

#### 最終架構完成狀態
- [x] **系統架構優化完成** - 2025-07-06
  - ✅ **目錄結構**：
    ```
    src/plugins/image-validation/
    ├── base-rules/                  # 基礎通用驗證規則
    │   ├── file-type.rule.ts        # 通用檔案格式驗證
    │   ├── filename.rule.ts         # 通用檔名格式驗證
    │   ├── filesize.rule.ts         # 通用檔案大小驗證
    │   └── index.ts
    ├── presets/
    │   ├── banner/                  # Banner 完整業務模組
    │   │   ├── file-type.rule.ts    # Banner WebP 強制驗證
    │   │   ├── filename-prefix.rule.ts # Banner 前綴驗證 (d_/m_)
    │   │   ├── filesize.rule.ts     # Banner 專屬檔案大小驗證
    │   │   ├── resolution.rule.ts   # Banner 解析度驗證 (16:9)
    │   │   ├── rules.ts             # Banner 規則統一匯出
    │   │   └── index.ts             # Banner 驗證管理器
    │   ├── general.preset.ts        # 通用圖片驗證管理器
    │   └── index.ts
    └── ...
    ```
  - ✅ **功能驗證**：所有驗證規則正常運作，攔截效果確實
  - ✅ **文檔更新**：README.md 已更新反映新架構和 1KB 檔案限制
  - ✅ **編譯通過**：ESLint、TypeScript、Vite Build 全部通過
  - ✅ **實際測試**：Banner 圖片上傳功能經測試完全正常，新的檔案大小限制運作良好

## 測試策略

### 單元測試範圍
1. **插件規則測試**
   - 每個驗證規則的邊界條件測試
   - 錯誤訊息正確性驗證
   - 優先級和執行順序測試

2. **驗證管理器測試**
   - 插件註冊和移除功能
   - 格式檢測動態性測試
   - 批量驗證結果處理

3. **UI 組件測試**
   - 檔案選擇和驗證流程
   - 錯誤訊息顯示邏輯
   - 檔名修改重新驗證

### 整合測試場景
1. **Banner 圖片上傳完整流程**
   - 桌面版和手機版圖片上傳
   - 各種檔案格式和大小測試
   - 錯誤處理和用戶反饋

2. **商品與文章圖片驗證**
   - 通用驗證管理器功能測試
   - 多格式圖片上傳驗證
   - 與 Banner 驗證的隔離性測試

3. **多業務場景驗證**
   - 不同驗證管理器的隔離性
   - 共用插件的一致性
   - 配置切換的正確性

## 錯誤處理與用戶體驗

### 錯誤分級
1. **錯誤級別** (Error) - 阻止上傳，必須修正
   - 檔案格式不支援
   - 解析度超出限制
   - 檔案大小超過上限

2. **警告級別** (Warning) - 建議優化，不阻止上傳
   - 檔案大小建議優化
   - 解析度比例建議調整

### 國際化支援
- **中文 (zh)**: 繁體中文錯誤訊息
- **英文 (en)**: 英文錯誤訊息  
- **泰文 (th)**: 泰文錯誤訊息
- **參數化翻譯**: 支援動態內容插入

### 用戶體驗優化
1. **即時反饋** - 檔案選擇後立即顯示驗證結果
2. **漸進式驗證** - 按優先級執行，快速失敗
3. **修正建議** - 提供具體的修正方向
4. **狀態保持** - 驗證失敗時保留其他已填寫資料

## 安全性考量

### 檔案安全
1. **類型檢測** - 檢查 MIME 類型和副檔名一致性
2. **大小限制** - 防止過大檔案上傳
3. **格式驗證** - 確保檔案格式符合業務需求

### 驗證安全
1. **輸入驗證** - 所有參數進行嚴格驗證
2. **錯誤訊息** - 提供清晰但不洩漏系統資訊的錯誤提示
3. **檔名安全** - 限制檔名字符，防止路徑注入攻擊

## 結論

圖片驗證插件系統已成功完成從概念設計到完整實作的全程開發，並經過多輪優化重構，形成了現代化、模組化的架構。

### 🎯 專案成果

1. **功能完整性**：系統成功實現了所有預期功能並經過實際測試驗證
   - ✅ Banner 圖片的嚴格驗證（WebP 強制、16:9 比例、前綴要求、1KB-5MB/3MB 檔案大小）
   - ✅ 通用圖片驗證（商品、文章等多格式支援，1KB-5MB 檔案大小）
   - ✅ 完整的錯誤攔截機制（所有違規都會阻止提交）
   - ✅ 實際測試確認（Banner 圖片上傳功能完全正常，檔案大小和解析度驗證有效攔截）

2. **架構優勢**：
   - 🔌 **插件化架構**：靈活的規則註冊與管理機制
   - 📁 **模組化設計**：業務邏輯按場景分離，便於維護擴展
   - 🎯 **業務解耦**：移除硬編碼依賴，實現真正的關注點分離
   - ⚡ **類型安全**：TypeScript + Zod 確保完整的類型檢查

3. **開發體驗**：
   - 🌐 **國際化支援**：完整的中、英、泰文錯誤訊息
   - 📚 **完善文檔**：詳細的 API 文檔和使用指南
   - 🧪 **測試覆蓋**：全面的單元測試確保功能穩定性

### 🚀 技術亮點

1. **創新架構模式**：
   - 將驗證規則按業務場景組織，而非技術分類
   - `base-rules/` 提供通用基礎，`presets/banner/` 提供業務專屬
   - 支援動態格式注入和依賴注入模式

2. **性能優化**：
   - 優先級驗證機制，快速失敗
   - 錯誤訊息比較機制，避免重複渲染
   - 驗證管理器去耦，提升組件性能

3. **可維護性**：
   - 每個業務場景的規則都在獨立目錄中
   - 統一的命名約定和檔案結構
   - 清晰的匯入/匯出關係

4. **檔案大小優化**：
   - 靈活的檔案大小限制（從 10KB 調整為 1KB）
   - 動態錯誤訊息支援（i18n 自動顯示正確數值）
   - 滿足實際使用需求的檔案大小範圍

### 📈 未來擴展能力

系統架構為未來擴展奠定了堅實基礎：

1. **新業務場景**：可輕易添加 `presets/product/`、`presets/avatar/` 等新模組
2. **AI 功能整合**：為未來的 AI 內容審核、自動優化等功能預留了擴展點
3. **高級驗證**：支援自定義規則，可實現複雜的業務邏輯驗證

### 🏆 專案價值

本系統不僅解決了當前的 Banner 圖片驗證需求，更重要的是建立了一套可重複使用、可擴展的圖片驗證框架。它成為了整個應用圖片處理的核心基礎設施，為開發團隊提供了統一、可靠的圖片驗證解決方案，同時為用戶提供了更好的圖片上傳體驗。

透過這次完整的開發和重構過程，系統展現了從單一功能到平台化解決方案的演進能力，為企業級應用的圖片處理建立了新的標準。