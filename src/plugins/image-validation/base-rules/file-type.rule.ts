import {
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_IMAGE_EXTENSIONS,
} from "../constants/supported-formats";

import type { ImageValidationRule, ValidationResult } from "../types";

/**
 * 檔案類型驗證規則
 * 檢查檔案的 MIME type 和副檔名
 * 支援動態格式限制：如果 context 中有 allowedTypes/allowedExtensions，則使用指定限制
 * 否則使用預設支援格式
 */
export const fileTypeRule: ImageValidationRule = {
  name: "file-type",
  priority: 1, // 最高優先級，最先執行
  async validate(file, _metadata, context): Promise<ValidationResult> {
    const t = context?.t;

    // 動態格式注入：優先使用 context 中的限制，否則使用預設
    const allowedTypes = context?.allowedTypes || SUPPORTED_IMAGE_TYPES;
    const allowedExtensions =
      context?.allowedExtensions || SUPPORTED_IMAGE_EXTENSIONS;

    const extensionsText = allowedExtensions.join(", ");

    // 檢查 MIME type
    if (!allowedTypes.includes(file.type)) {
      const message = t
        ? t("validation.image.type.unsupported", { extensions: extensionsText })
        : `不支援的檔案類型。請上傳 ${extensionsText} 格式的圖片`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    // 檢查副檔名
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !allowedExtensions.includes(`.${extension}`)) {
      const message = t
        ? t("validation.image.type.extensionMismatch", {
            extensions: extensionsText,
          })
        : `不支援的副檔名。請確保檔案為 ${extensionsText} 格式`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};
