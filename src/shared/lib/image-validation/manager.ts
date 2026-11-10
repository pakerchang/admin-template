import { produce } from "immer";

import { getSupportedImageFormats } from "./constants/supported-formats";
import { getImageMetadata } from "./utils/image-metadata";

import type {
  ImageValidationRule,
  IValidationManager,
  ValidationOptions,
  BatchValidationResult,
  ValidationContext,
  ImageMetadata,
} from "./types";

/**
 * 圖片驗證管理器
 * 負責管理和執行驗證規則
 */
export class ValidationManager implements IValidationManager {
  private rules: Record<string, ImageValidationRule> = {};

  /**
   * 註冊驗證規則
   */
  registerRule(rule: ImageValidationRule): void {
    if (!rule.name) {
      throw new Error("Validation rule must have a name");
    }

    this.rules = produce(this.rules, (draft) => {
      draft[rule.name] = {
        ...rule,
        priority: rule.priority ?? 10,
      };
    });
  }

  /**
   * 移除驗證規則
   */
  unregisterRule(ruleName: string): void {
    this.rules = produce(this.rules, (draft) => {
      delete draft[ruleName];
    });
  }

  /**
   * 取得所有規則（依優先級排序）
   */
  getRules(): ReadonlyArray<ImageValidationRule> {
    return Object.values(this.rules).sort(
      (a, b) => (a.priority ?? 10) - (b.priority ?? 10)
    );
  }

  /**
   * 清除所有規則
   */
  clearRules(): void {
    this.rules = {};
  }

  /**
   * 獲取支援的檔案格式
   *
   * 優先使用 context 中的動態格式限制
   * 如果沒有動態限制且有註冊 file-type 規則，則從共享格式定義獲取
   * 否則回傳空陣列（表示無格式限制）
   */
  getAllowedFormats(context?: ValidationContext): {
    types: string[];
    extensions: string[];
  } {
    // 優先使用 context 中的動態格式限制
    if (context?.allowedTypes && context?.allowedExtensions) {
      return {
        types: context.allowedTypes,
        extensions: context.allowedExtensions,
      };
    }

    // 檢查是否有註冊 file-type 規則
    const fileTypeRule = this.rules["file-type"];

    if (fileTypeRule) {
      // 從共享的格式定義獲取支援的格式
      return getSupportedImageFormats();
    }

    // 如果沒有 file-type 規則，回傳空陣列（無格式限制）
    return { types: [], extensions: [] };
  }

  /**
   * 執行圖片驗證
   */
  async validateImage(
    file: File,
    options?: ValidationOptions
  ): Promise<BatchValidationResult> {
    // 讀取圖片元數據
    let metadata: ImageMetadata | undefined;
    try {
      metadata = await getImageMetadata(file);
    } catch (error) {
      console.warn("Failed to read image metadata:", error);
    }

    const context: ValidationContext = {
      imageType: options?.imageType,
      allowedTypes: options?.allowedTypes,
      allowedExtensions: options?.allowedExtensions,
      existingRules: options?.customRules
        ? {
            filenameRules: options.customRules
              .filter((r) => r.name.includes("filename"))
              .map(() => ({ pattern: /.*/, message: "" }))[0],
          }
        : undefined,
      t: options?.t,
    };

    const rulesToExecute = this.getRules();

    const allRulesToExecute = options?.customRules
      ? [...rulesToExecute, ...options.customRules]
      : rulesToExecute;

    const results = await Promise.all(
      allRulesToExecute.map(async (rule) => {
        try {
          const result = await rule.validate(file, metadata, context);
          return {
            ruleName: rule.name,
            result,
          };
        } catch (error) {
          return {
            ruleName: rule.name,
            result: {
              isValid: false,
              message: `驗證規則執行失敗: ${
                error instanceof Error ? error.message : "未知錯誤"
              }`,
              severity: "error" as const,
            },
          };
        }
      })
    );

    const errors = results
      .filter((r) => !r.result.isValid && r.result.severity !== "warning")
      .map((r) => r.result);

    const warnings = results
      .filter((r) => !r.result.isValid && r.result.severity === "warning")
      .map((r) => r.result);

    return {
      isValid: errors.length === 0,
      results,
      errors,
      warnings,
    };
  }
}

/**
 * 建立驗證管理器實例
 */
export function createValidationManager(): ValidationManager {
  return new ValidationManager();
}
