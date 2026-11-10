import type {
  ValidationSeveritySchema,
  ValidationResultSchema,
  ImageMetadataSchema,
  ImageTypeSchema,
  FilenameRuleSchema,
  ValidationContextSchema,
  ValidationOptionsSchema,
  BatchValidationResultSchema,
} from "./schemas";
import type { z } from "zod";

export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;
export type ImageType = z.infer<typeof ImageTypeSchema>;
export type FilenameRule = z.infer<typeof FilenameRuleSchema>;
export type ValidationContext = z.infer<typeof ValidationContextSchema>;
export type ValidationOptions = z.infer<typeof ValidationOptionsSchema>;
export type BatchValidationResult = z.infer<typeof BatchValidationResultSchema>;

export interface ImageValidationRule {
  name: string;
  priority?: number;
  validate: (
    file: File,
    metadata?: ImageMetadata,
    context?: ValidationContext
  ) => Promise<ValidationResult>;
}

export interface IValidationManager {
  registerRule(rule: ImageValidationRule): void;
  unregisterRule(ruleName: string): void;
  validateImage(
    file: File,
    options?: ValidationOptions
  ): Promise<BatchValidationResult>;
  getRules(): ReadonlyArray<ImageValidationRule>;
  clearRules(): void;
  // 新增：從註冊的規則中獲取允許的格式，支援動態 context
  getAllowedFormats(context?: ValidationContext): {
    types: string[];
    extensions: string[];
  };
}
