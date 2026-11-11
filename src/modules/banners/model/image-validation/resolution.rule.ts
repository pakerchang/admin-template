import {
  calculateAspectRatio,
  isAspectRatioInRange,
} from "@/shared/lib/image-validation";

import type {
  ImageValidationRule,
  ValidationResult,
  ImageMetadata,
  ValidationContext,
} from "@/shared/lib/image-validation";

/**
 * Banner 桌面版解析度驗證規則
 */
export const bannerDesktopResolutionRule: ImageValidationRule = {
  name: "banner-desktop-resolution",
  priority: 10,
  async validate(
    _file: File,
    metadata: ImageMetadata | undefined,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const { t } = context;

    if (!metadata || !metadata.width || !metadata.height) {
      const message = t(
        "banners.validation.image.resolution.metadataMissing",
        {}
      );

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
      const message = t(
        "banners.validation.image.resolution.desktop.tooSmall",
        {}
      );

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const message = t(
        "banners.validation.image.resolution.desktop.tooLarge",
        {}
      );

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
      const message = t(
        "banners.validation.image.resolution.desktop.aspectRatio",
        {}
      );

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
    metadata: ImageMetadata | undefined,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const { t } = context;

    if (!metadata || !metadata.width || !metadata.height) {
      const message = t(
        "banners.validation.image.resolution.metadataMissing",
        {}
      );

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
      const message = t("banners.validation.image.resolution.mobile.tooSmall", {
        minResolution,
      });

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const maxResolution = `${MAX_WIDTH}x${MAX_HEIGHT}`;
      const message = t("banners.validation.image.resolution.mobile.tooLarge", {
        maxResolution,
      });

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
      const message = t(
        "banners.validation.image.resolution.mobile.aspectRatio",
        {}
      );

      return {
        isValid: false,
        message,
        severity: "error",
      };
    }

    return { isValid: true };
  },
};
