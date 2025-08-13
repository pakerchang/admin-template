import { formatFileSize } from "../utils/image-metadata";

import type { ImageValidationRule, ValidationResult } from "../types";

const MIN_FILE_SIZE = 1 * 1024; // 1KB
const MAX_FILE_SIZE_GENERAL = 5 * 1024 * 1024; // 5MB (通用限制)

/**
 * 通用檔案大小驗證規則
 * 適用於非 Banner 圖片的基本檔案大小檢查
 */
export const filesizeRule: ImageValidationRule = {
  name: "file-size",
  priority: 15,
  async validate(file, metadata, context): Promise<ValidationResult> {
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

    if (fileSize > MAX_FILE_SIZE_GENERAL) {
      const maxSizeFormatted = formatFileSize(MAX_FILE_SIZE_GENERAL);
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
