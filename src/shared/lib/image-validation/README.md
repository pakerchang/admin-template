# Image Validation Plugin System

圖片驗證插件系統，提供靈活且可擴展的圖片驗證功能，支援多種業務場景。

## 📋 功能特點

- 🔌 **插件化架構**：可動態註冊/移除驗證規則
- 🌐 **i18n 支援**：完整的多語言錯誤訊息
- ⚡ **類型安全**：使用 TypeScript + Zod 確保類型安全
- 🎯 **業務場景專屬**：Banner、商品、文章等不同場景的專屬驗證
- 🚫 **嚴格模式**：所有驗證失敗都會攔截 submit 操作

## 🏗️ 架構概覽

```
src/shared/lib/image-validation/
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

## 🚀 快速開始

### Banner 圖片驗證（專屬場景）

```typescript
import {
  createDesktopBannerValidationManager,
  createMobileBannerValidationManager,
} from "@/shared/lib/image-validation";

// 建立桌面版 Banner 驗證管理器
const desktopManager = createDesktopBannerValidationManager();

// 建立手機版 Banner 驗證管理器
const mobileManager = createMobileBannerValidationManager();

// 驗證桌面版圖片
const desktopResult = await desktopManager.validateImage(file);

// 驗證手機版圖片
const mobileResult = await mobileManager.validateImage(file);

if (result.isValid) {
  console.log("✅ 驗證通過");
} else {
  console.error("❌ 驗證失敗:", result.errors);
  // 注意：新架構中沒有 warnings，所有違規都是 errors
}
```

### 通用圖片驗證（商品、文章等）

```typescript
import { createGeneralImageValidationManager } from "@/shared/lib/image-validation";

// 建立通用圖片驗證管理器（適用於商品圖片、文章封面等）
const generalManager = createGeneralImageValidationManager();

const result = await generalManager.validateImage(file);
```

### 與 react-i18next 整合

```typescript
import { useTranslation } from "react-i18next";
import { createDesktopBannerValidationManager } from "@/shared/lib/image-validation";

const MyComponent = () => {
  const { t } = useTranslation();

  const handleFileUpload = async (file: File) => {
    const manager = createDesktopBannerValidationManager();

    const result = await manager.validateImage(file, {
      t: t, // 傳入翻譯函數
    });

    // 處理驗證結果...
  };
};
```

## 📚 驗證規則分類

### 基礎規則 (`base-rules/`)

通用於所有圖片類型的基礎驗證：

- **`fileTypeRule`** - 檔案類型檢查（JPEG, PNG, WebP）
- **`filenameFormatRule`** - 檔名格式檢查（英數字、底線、連字符）
- **`filesizeRule`** - 通用檔案大小檢查（1KB ~ 5MB）

### Banner 專屬規則 (`presets/banner/`)

專為 Banner 業務場景設計的嚴格驗證：

- **`bannerFileTypeRule`** - WebP 格式強制要求
- **`desktopFilenamePrefixRule`** - 桌面版檔名前綴檢查 (`d_`)
- **`mobileFilenamePrefixRule`** - 手機版檔名前綴檢查 (`m_`)
- **`bannerDesktopResolutionRule`** - 桌面版解析度驗證（1280×720 ~ 3840×2160, 16:9）
- **`bannerMobileResolutionRule`** - 手機版解析度驗證（640×360 ~ 1920×1080, 16:9）
- **`bannerDesktopFilesizeRule`** - 桌面版檔案大小驗證（1KB ~ 5MB）
- **`bannerMobileFilesizeRule`** - 手機版檔案大小驗證（1KB ~ 3MB）

## ⚙️ 業務場景配置

### Banner 驗證配置

桌面版 Banner：

```typescript
{
  fileFormat: "WebP 強制",
  filenamePrefix: "d_",
  resolution: {
    min: "1280×720",
    max: "3840×2160",
    aspectRatio: "16:9"
  },
  fileSize: {
    min: "1KB",
    max: "5MB"
  }
}
```

手機版 Banner：

```typescript
{
  fileFormat: "WebP 強制",
  filenamePrefix: "m_",
  resolution: {
    min: "640×360",
    max: "1920×1080",
    aspectRatio: "16:9"
  },
  fileSize: {
    min: "1KB",
    max: "3MB"
  }
}
```

### 通用圖片驗證配置

商品圖片、文章封面等：

```typescript
{
  fileFormat: "JPEG/PNG/WebP 支援",
  filenamePrefix: "無要求",
  resolution: "無限制",
  fileSize: {
    min: "1KB",
    max: "5MB"
  }
}
```

## 🔧 自定義驗證規則

```typescript
import type { ImageValidationRule } from '@/shared/lib/image-validation'

const customRule: ImageValidationRule = {
  name: 'custom-rule',
  priority: 20,
  async validate(file, metadata, context) {
    // 你的驗證邏輯
    if (/* 某個條件 */) {
      return {
        isValid: false,
        message: '自定義錯誤訊息',
        severity: 'error' // 只支援 'error'，不再有 'warning'
      }
    }

    return { isValid: true }
  }
}

manager.registerRule(customRule)
```

## 🌐 i18n 訊息配置

在翻譯檔案中已預設包含所有驗證訊息：

```json
{
  "validation": {
    "image": {
      "type": {
        "unsupported": "不支援的檔案類型。請上傳 {{extensions}} 格式的圖片",
        "extensionMismatch": "副檔名不匹配。請確保檔案為 {{extensions}} 格式"
      },
      "fileName": {
        "format": "檔名只能包含英文字母、數字、底線(_)和連字符(-)"
      },
      "fileSize": {
        "tooSmall": "檔案大小過小，可能影響圖片品質，建議至少 {{minSize}}",
        "tooLarge": "檔案大小超過限制，最大支援 {{maxSize}}"
      },
      "prefix": {
        "desktop": "桌面版圖片檔名請以 d_ 開頭",
        "mobile": "手機版圖片檔名請以 m_ 開頭"
      },
      "resolution": {
        "desktop": {
          "tooSmall": "桌面版圖片解析度過小，建議最小 1280x720 像素",
          "tooLarge": "桌面版圖片解析度過大，最大支援 3840x2160 像素",
          "aspectRatio": "建議使用 16:9 的寬高比以獲得最佳顯示效果"
        },
        "mobile": {
          "tooSmall": "手機版圖片解析度過小，建議最小 {{minResolution}} 像素",
          "tooLarge": "手機版圖片解析度過大，最大支援 {{maxResolution}} 像素",
          "aspectRatio": "手機版建議使用 16:9 的寬高比"
        }
      }
    }
  }
}
```

## 📝 API 參考

### ValidationManager

```typescript
interface IValidationManager {
  registerRule(rule: ImageValidationRule): void;
  unregisterRule(ruleName: string): void;
  validateImage(
    file: File,
    options?: ValidationOptions
  ): Promise<BatchValidationResult>;
  getRules(): ReadonlyArray<ImageValidationRule>;
  clearRules(): void;
  getAllowedFormats(context?: ValidationContext): {
    types: string[];
    extensions: string[];
  };
}
```

### ValidationOptions

```typescript
interface ValidationOptions {
  t?: (key: string, options?: Record<string, unknown>) => string;
}
```

### BatchValidationResult

```typescript
interface BatchValidationResult {
  isValid: boolean;
  results: Array<{
    ruleName: string;
    result: ValidationResult;
  }>;
  errors: ValidationResult[];
  // 注意：不再有 warnings 陣列，所有驗證失敗都是 errors
}
```

## 🆚 使用場景對照

| 功能          | 驗證管理器                               | 檔案格式      | 前綴要求 | 解析度驗證 | 檔案大小 |
| ------------- | ---------------------------------------- | ------------- | -------- | ---------- | -------- |
| Banner 桌面版 | `createDesktopBannerValidationManager()` | WebP 強制     | d\_      | ✅ 16:9    | 1KB-5MB  |
| Banner 手機版 | `createMobileBannerValidationManager()`  | WebP 強制     | m\_      | ✅ 16:9    | 1KB-3MB  |
| 商品圖片      | `createGeneralImageValidationManager()`  | JPEG/PNG/WebP | ❌ 無    | ❌ 無      | 1KB-5MB  |
| 文章封面      | `createGeneralImageValidationManager()`  | JPEG/PNG/WebP | ❌ 無    | ❌ 無      | 1KB-5MB  |

## 🔄 重構歷程

此系統已完成以下重構優化：

1. **架構重構**：從單一檔案重構為模組化架構
2. **驗證分離**：桌面版和手機版使用不同的驗證管理器
3. **業務解耦**：移除 `imageType` 依賴，實現真正解耦
4. **錯誤統一**：所有違規都使用 `error` 級別，確保攔截效果
5. **Code Split**：規則按業務場景分組，易於維護和擴展
