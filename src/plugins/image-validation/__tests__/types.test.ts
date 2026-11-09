import { describe, expectTypeOf, it } from "vitest";

import type { ValidationContext, ValidationOptions } from "../types";

// Pins the plugin types as Zod 3 inferred them from z.function().args().returns(),
// so the Zod 4 z.custom<Fn>() rewrite keeps them identical.
type I18nFn = (
  key: string,
  options: Record<string, unknown> | undefined,
  ...rest: unknown[]
) => string;

type ExpectedContext = {
  imageType?: "desktop" | "mobile";
  allowedTypes?: string[];
  allowedExtensions?: string[];
  existingRules?: {
    filenameRules?: { pattern: RegExp; message: string };
  };
  t?: I18nFn;
};

type ExpectedValidate = (
  file: File,
  metadata:
    { width: number; height: number; size: number; type: string } | undefined,
  context: ExpectedContext | undefined,
  ...rest: unknown[]
) => Promise<{
  isValid: boolean;
  message?: string;
  severity?: "error" | "warning";
}>;

describe("image-validation inferred types", () => {
  it("ValidationContext", () => {
    expectTypeOf<ValidationContext>().toEqualTypeOf<ExpectedContext>();
  });

  it("ValidationOptions", () => {
    expectTypeOf<ValidationOptions>().toEqualTypeOf<{
      imageType?: "desktop" | "mobile";
      allowedTypes?: string[];
      allowedExtensions?: string[];
      maxFileSize?: number;
      customRules?: {
        name: string;
        priority: number;
        validate: ExpectedValidate;
      }[];
      t?: I18nFn;
    }>();
  });
});
