import { z } from "zod";

export const ValidationSeveritySchema = z.enum(["error", "warning"]);

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  message: z.string().optional(),
  severity: ValidationSeveritySchema.optional(),
});

export const ImageMetadataSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  size: z.number().positive(),
  type: z.string(),
});

export const ImageTypeSchema = z.enum(["desktop", "mobile"]);

export const FilenameRuleSchema = z.object({
  pattern: z.instanceof(RegExp),
  message: z.string(),
});

// Function fields are never parsed, only inferred; z.custom keeps the Zod 3 signatures.
type I18nFunction = (
  key: string,
  options: Record<string, unknown> | undefined,
  ...rest: unknown[]
) => string;

export const I18nFunctionSchema = z.custom<I18nFunction>();

export const ValidationContextSchema = z.object({
  imageType: ImageTypeSchema.optional(),
  allowedTypes: z.array(z.string()).optional(),
  allowedExtensions: z.array(z.string()).optional(),
  existingRules: z
    .object({
      filenameRules: FilenameRuleSchema.optional(),
    })
    .optional(),
  t: I18nFunctionSchema,
});

export const ValidationRuleSchema = z.object({
  name: z.string(),
  priority: z.number().default(10),
  validate:
    z.custom<
      (
        file: File,
        metadata: z.infer<typeof ImageMetadataSchema> | undefined,
        context: z.infer<typeof ValidationContextSchema>,
        ...rest: unknown[]
      ) => Promise<z.infer<typeof ValidationResultSchema>>
    >(),
});

export const ValidationOptionsSchema = z.object({
  imageType: ImageTypeSchema.optional(),
  allowedTypes: z.array(z.string()).optional(),
  allowedExtensions: z.array(z.string()).optional(),
  maxFileSize: z.number().positive().optional(),
  customRules: z.array(ValidationRuleSchema).optional(),
  t: I18nFunctionSchema,
});

export const BatchValidationResultSchema = z.object({
  isValid: z.boolean(),
  results: z.array(
    z.object({
      ruleName: z.string(),
      result: ValidationResultSchema,
    })
  ),
  errors: z.array(ValidationResultSchema),
  warnings: z.array(ValidationResultSchema),
});
