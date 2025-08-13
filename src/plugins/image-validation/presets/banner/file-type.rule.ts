import type {
  ImageValidationRule,
  ValidationResult,
  ImageMetadata,
  ValidationContext,
} from "../../types";

/**
 * Banner 專用檔案格式驗證規則
 * 強制要求 WebP 格式
 */
export const bannerFileTypeRule: ImageValidationRule = {
  name: "banner-file-type",
  priority: 1,
  async validate(
    file: File,
    _metadata?: ImageMetadata,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const t = context?.t;

    const allowedTypes = ["image/webp"];
    const allowedExtensions = [".webp"];
    const extensionsText = allowedExtensions.join(", ");

    if (!allowedTypes.includes(file.type)) {
      const message = t
        ? t("validation.image.type.unsupported", { extensions: extensionsText })
        : `Banner 圖片請使用 ${extensionsText} 格式以確保最佳顯示品質和載入速度`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !allowedExtensions.includes(`.${extension}`)) {
      const message = t
        ? t("validation.image.type.extensionMismatch", {
            extensions: extensionsText,
          })
        : `Banner 圖片請使用 ${extensionsText} 格式`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};
