import type { ImageValidationRule, ValidationResult } from "../types";

/**
 * 檔名格式驗證規則
 * 檢查檔名是否只包含英文、數字、底線和連字符
 */
export const filenameFormatRule: ImageValidationRule = {
  name: "filename-format",
  priority: 2,
  async validate(file, _metadata, context): Promise<ValidationResult> {
    const t = context?.t;

    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf("."));

    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(nameWithoutExt)) {
      const message = t
        ? t("validation.image.fileName.format", {})
        : "檔名只能包含英文字母、數字、底線(_)和連字符(-)";

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};
