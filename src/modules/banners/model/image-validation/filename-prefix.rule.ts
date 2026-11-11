import type {
  ImageValidationRule,
  ValidationResult,
  ImageMetadata,
  ValidationContext,
} from "@/shared/lib/image-validation";

/**
 * 桌面版檔名前綴驗證規則
 */
export const desktopFilenamePrefixRule: ImageValidationRule = {
  name: "desktop-filename-prefix",
  priority: 2,
  async validate(
    file: File,
    _metadata: ImageMetadata | undefined,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const { t } = context;
    const fileName = file.name;

    if (!fileName.startsWith("d_")) {
      const message = t("banners.validation.image.prefix.desktop", {});

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
    _metadata: ImageMetadata | undefined,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const { t } = context;
    const fileName = file.name;

    if (!fileName.startsWith("m_")) {
      const message = t("banners.validation.image.prefix.mobile", {});

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};
