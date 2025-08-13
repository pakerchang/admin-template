import { formatFileSize } from "../../utils/image-metadata";

import type {
  ImageValidationRule,
  ValidationResult,
  ImageMetadata,
  ValidationContext,
} from "../../types";

// 檔案大小限制（bytes）
const MIN_FILE_SIZE = 1 * 1024; // 1KB
const MAX_FILE_SIZE_DESKTOP = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_MOBILE = 3 * 1024 * 1024; // 3MB

/**
 * Banner 桌面版檔案大小驗證規則
 */
export const bannerDesktopFilesizeRule: ImageValidationRule = {
  name: "banner-desktop-filesize",
  priority: 15,
  async validate(
    file: File,
    metadata?: ImageMetadata,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const t = context?.t;
    const fileSize = metadata?.size || file.size;

    if (fileSize < MIN_FILE_SIZE) {
      const minSize = formatFileSize(MIN_FILE_SIZE);
      const message = t
        ? t("validation.image.fileSize.tooSmall", { minSize })
        : `檔案大小過小，可能影響圖片品質，建議至少 ${minSize}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    if (fileSize > MAX_FILE_SIZE_DESKTOP) {
      const maxSizeFormatted = formatFileSize(MAX_FILE_SIZE_DESKTOP);
      const message = t
        ? t("validation.image.fileSize.tooLarge", { maxSize: maxSizeFormatted })
        : `檔案大小超過限制，最大支援 ${maxSizeFormatted}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};

/**
 * Banner 手機版檔案大小驗證規則
 */
export const bannerMobileFilesizeRule: ImageValidationRule = {
  name: "banner-mobile-filesize",
  priority: 15,
  async validate(
    file: File,
    metadata?: ImageMetadata,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const t = context?.t;
    const fileSize = metadata?.size || file.size;

    if (fileSize < MIN_FILE_SIZE) {
      const minSize = formatFileSize(MIN_FILE_SIZE);
      const message = t
        ? t("validation.image.fileSize.tooSmall", { minSize })
        : `檔案大小過小，可能影響圖片品質，建議至少 ${minSize}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    if (fileSize > MAX_FILE_SIZE_MOBILE) {
      const maxSizeFormatted = formatFileSize(MAX_FILE_SIZE_MOBILE);
      const message = t
        ? t("validation.image.fileSize.tooLarge", { maxSize: maxSizeFormatted })
        : `檔案大小超過限制，最大支援 ${maxSizeFormatted}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};
