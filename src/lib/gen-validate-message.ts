import { useTranslation } from "react-i18next";

import type { TransKey } from "@/constants/locales";
import type { TFunction } from "i18next";

type TFieldPath = Extract<TransKey, `pages.${string}`>;

type TValidationMessage = {
  getRequiredMessage: (fieldPath: TFieldPath) => string;
  getRequiredLangMessage: (fieldPath: TFieldPath) => string;
  getMinNumberMessage: (fieldPath: TFieldPath, min: number) => string;
  getMinImagesMessage: () => string;
  getMinTextLengthMessage: (fieldPath: TFieldPath, min: number) => string;
  getMaxTextLengthMessage: (fieldPath: TFieldPath, max: number) => string;
};

const createValidationMessageHelper = (
  t: TFunction<"translation", undefined>
) => ({
  getRequiredMessage: (fieldPath: TFieldPath) => {
    const field = t(fieldPath);
    return t("validation.required.field", { field });
  },
  getRequiredLangMessage: (fieldPath: TFieldPath) => {
    const field = t(fieldPath);
    return t("validation.required.allLanguages", { field });
  },
  getMinNumberMessage: (fieldPath: TFieldPath, min: number) => {
    const field = t(fieldPath);
    return t("validation.number.min", {
      field,
      min: String(min),
    });
  },
  getMinImagesMessage: () => t("validation.required.minImages"),
  getMinTextLengthMessage: (fieldPath: TFieldPath, min: number) => {
    const field = t(fieldPath);
    return t("validation.text.min", {
      field,
      min: String(min),
    });
  },
  getMaxTextLengthMessage: (fieldPath: TFieldPath, max: number) => {
    const field = t(fieldPath);
    return t("validation.text.max", {
      field,
      max: String(max),
    });
  },
});

export const useValidationMessage = (): TValidationMessage => {
  const { t } = useTranslation();
  return createValidationMessageHelper(t);
};
