import { fileTypeRule, filenameFormatRule, filesizeRule } from "../base-rules";
import { createValidationManager } from "../manager";

import type { IValidationManager } from "../types";

/**
 * 建立通用圖片驗證管理器
 * 適用於商品圖片、文章封面等一般圖片上傳場景
 *
 * 包含的驗證規則：
 * - 檔案類型驗證（JPEG、PNG、WebP）
 * - 檔名格式驗證（英文、數字、底線、連字符）
 * - 檔案大小驗證（基本限制）
 *
 * 不包含的規則：
 * - 檔名前綴驗證（無 d_、m_ 要求）
 * - WebP 格式驗證（不強制或建議 WebP）
 * - 解析度驗證（無解析度限制）
 *
 * @example
 * // 實際驗證配置
 * const validationConfig = {
 *   // 支援的檔案類型
 *   allowedTypes: ["image/jpeg", "image/png", "image/webp"],
 *
 *   // 檔案大小限制
 *   fileSize: {
 *     min: "10KB",
 *     max: "5MB", // 桌面版最大 5MB，手機版最大 3MB
 *   },
 *
 *   // 檔名規則
 *   filename: {
 *     pattern: /^[a-zA-Z0-9_-]+$/,
 *     description: "檔名只能包含英文字母、數字、底線和連字符",
 *   },
 *
 *   // 特性說明
 *   features: {
 *     supportedFormats: ["JPEG", "PNG", "WebP"],
 *     prefixRequired: false,    // 無前綴要求
 *     resolutionLimits: false,  // 無解析度限制
 *     webpRequired: false,      // 不強制 WebP
 *   }
 * }
 */
export function createGeneralImageValidationManager(): IValidationManager {
  const manager = createValidationManager();

  const generalRules = [fileTypeRule, filenameFormatRule, filesizeRule];

  generalRules.forEach((rule) => manager.registerRule(rule));

  return manager;
}
