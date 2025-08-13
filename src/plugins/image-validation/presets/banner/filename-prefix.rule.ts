import type {
  ImageValidationRule,
  ValidationResult,
  ImageMetadata,
  ValidationContext,
} from "../../types";

/**
 * 桌面版檔名前綴驗證規則
 */
export const desktopFilenamePrefixRule: ImageValidationRule = {
  name: "desktop-filename-prefix",
  priority: 2,
  async validate(
    file: File,
    _metadata?: ImageMetadata,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const t = context?.t;
    const fileName = file.name;

    if (!fileName.startsWith("d_")) {
      const message = t
        ? t("validation.image.prefix.desktop", {})
        : "桌面版圖片檔名請以 d_ 開頭";

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
 * 手機版檔名前綴驗證規則
 */
export const mobileFilenamePrefixRule: ImageValidationRule = {
  name: "mobile-filename-prefix",
  priority: 2,
  async validate(
    file: File,
    _metadata?: ImageMetadata,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const t = context?.t;
    const fileName = file.name;

    if (!fileName.startsWith("m_")) {
      const message = t
        ? t("validation.image.prefix.mobile", {})
        : "手機版圖片檔名請以 m_ 開頭";

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};
