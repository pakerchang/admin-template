import {
  calculateAspectRatio,
  isAspectRatioInRange,
} from "../../utils/image-metadata";

import type {
  ImageValidationRule,
  ValidationResult,
  ImageMetadata,
  ValidationContext,
} from "../../types";

/**
 * Banner 桌面版解析度驗證規則
 */
export const bannerDesktopResolutionRule: ImageValidationRule = {
  name: "banner-desktop-resolution",
  priority: 10,
  async validate(
    _file: File,
    metadata?: ImageMetadata,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const t = context?.t;

    if (!metadata || !metadata.width || !metadata.height) {
      const message = "無法獲取圖片尺寸資訊，請確保檔案為有效的圖片格式";

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    const width = metadata.width;
    const height = metadata.height;

    const MIN_WIDTH = 1280;
    const MIN_HEIGHT = 720;
    const MAX_WIDTH = 3840;
    const MAX_HEIGHT = 2160;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      const message = t
        ? t("validation.image.resolution.desktop.tooSmall", {})
        : `桌面版圖片解析度過小，最小支援 ${MIN_WIDTH}×${MIN_HEIGHT}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const message = t
        ? t("validation.image.resolution.desktop.tooLarge", {})
        : `桌面版圖片解析度過大，最大支援 ${MAX_WIDTH}×${MAX_HEIGHT}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    const aspectRatio = calculateAspectRatio(width, height);
    const targetRatio = 16 / 9;
    const tolerance = 0.05; // 5% 容許誤差

    if (!isAspectRatioInRange(aspectRatio, targetRatio, tolerance)) {
      const message = t
        ? t("validation.image.resolution.desktop.aspectRatio", {})
        : `桌面版圖片寬高比不符合 16:9 規範，目前為 ${width}×${height}`;

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
 * Banner 手機版解析度驗證規則
 */
export const bannerMobileResolutionRule: ImageValidationRule = {
  name: "banner-mobile-resolution",
  priority: 10,
  async validate(
    _file: File,
    metadata?: ImageMetadata,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const t = context?.t;

    if (!metadata || !metadata.width || !metadata.height) {
      const message = "無法獲取圖片尺寸資訊，請確保檔案為有效的圖片格式";

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    const width = metadata.width;
    const height = metadata.height;

    const MIN_WIDTH = 640;
    const MIN_HEIGHT = 360;
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      const minResolution = `${MIN_WIDTH}x${MIN_HEIGHT}`;
      const message = t
        ? t("validation.image.resolution.mobile.tooSmall", { minResolution })
        : `手機版圖片解析度過小，最小支援 ${MIN_WIDTH}×${MIN_HEIGHT}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const maxResolution = `${MAX_WIDTH}x${MAX_HEIGHT}`;
      const message = t
        ? t("validation.image.resolution.mobile.tooLarge", { maxResolution })
        : `手機版圖片解析度過大，最大支援 ${MAX_WIDTH}×${MAX_HEIGHT}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    const aspectRatio = calculateAspectRatio(width, height);
    const targetRatio = 16 / 9;
    const tolerance = 0.05; // 5% 容許誤差

    if (!isAspectRatioInRange(aspectRatio, targetRatio, tolerance)) {
      const message = t
        ? t("validation.image.resolution.mobile.aspectRatio", {})
        : `手機版圖片寬高比不符合 16:9 規範，目前為 ${width}×${height}`;

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};
