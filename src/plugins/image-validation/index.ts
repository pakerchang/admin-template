export { ValidationManager, createValidationManager } from "./manager";

export type {
  ImageValidationRule,
  IValidationManager,
  ValidationResult,
  ValidationSeverity,
  ImageMetadata,
  ImageType,
  ValidationContext,
  ValidationOptions,
  BatchValidationResult,
} from "./types";

export * from "./base-rules";

export {
  getImageMetadata,
  calculateAspectRatio,
  isAspectRatioInRange,
  formatFileSize,
} from "./utils/image-metadata";

export {
  createDesktopBannerValidationManager,
  createMobileBannerValidationManager,
  createGeneralImageValidationManager,
} from "./presets";
