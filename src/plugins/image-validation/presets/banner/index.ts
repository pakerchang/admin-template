import { filenameFormatRule } from "../../base-rules";
import { createValidationManager } from "../../manager";

import {
  bannerFileTypeRule,
  desktopFilenamePrefixRule,
  mobileFilenamePrefixRule,
  bannerDesktopResolutionRule,
  bannerMobileResolutionRule,
  bannerDesktopFilesizeRule,
  bannerMobileFilesizeRule,
} from "./rules";

import type { IValidationManager } from "../../types";

/**
 * 建立桌面版 Banner 圖片驗證管理器
 * Banner 業務邏輯耦合點：強制要求 WebP 格式
 *
 * 包含的驗證規則：
 * - 檔案格式驗證（僅 WebP）
 * - 檔名格式驗證（英文、數字、底線、連字符）
 * - 檔名前綴驗證（d_ 要求）
 * - 解析度驗證（桌面解析度限制）
 * - 檔案大小驗證（5MB 限制）
 */
export function createDesktopBannerValidationManager(): IValidationManager {
  const manager = createValidationManager();

  const desktopRules = [
    bannerFileTypeRule,
    filenameFormatRule,
    desktopFilenamePrefixRule,
    bannerDesktopResolutionRule,
    bannerDesktopFilesizeRule,
  ];

  desktopRules.forEach((rule) => manager.registerRule(rule));

  return manager;
}

/**
 * 建立手機版 Banner 圖片驗證管理器
 * Banner 業務邏輯耦合點：強制要求 WebP 格式
 *
 * 包含的驗證規則：
 * - 檔案格式驗證（僅 WebP）
 * - 檔名格式驗證（英文、數字、底線、連字符）
 * - 檔名前綴驗證（m_ 要求）
 * - 解析度驗證（手機解析度限制）
 * - 檔案大小驗證（3MB 限制）
 */
export function createMobileBannerValidationManager(): IValidationManager {
  const manager = createValidationManager();

  const mobileRules = [
    bannerFileTypeRule,
    filenameFormatRule,
    mobileFilenamePrefixRule,
    bannerMobileResolutionRule,
    bannerMobileFilesizeRule,
  ];

  mobileRules.forEach((rule) => manager.registerRule(rule));

  return manager;
}
