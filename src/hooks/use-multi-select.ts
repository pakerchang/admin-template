import { useCallback } from "react";

import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

/**
 * 多選表單欄位的自定義 Hook
 * 提供新增、移除項目的邏輯，簡化多選組件的狀態管理
 */
export const useMultiSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  fieldName: TName,
  form: UseFormReturn<TFieldValues>
) => {
  const addItem = useCallback(
    (item: string) => {
      const current = (form.getValues(fieldName) as string[]) || [];
      if (!current.includes(item)) {
        const formUpdateOptions = {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        } as const;
        form.setValue(
          fieldName,
          [...current, item] as TFieldValues[TName],
          formUpdateOptions
        );
      }
    },
    [fieldName, form]
  );

  const removeItem = useCallback(
    (item: string) => {
      const current = (form.getValues(fieldName) as string[]) || [];
      form.setValue(
        fieldName,
        current.filter((id) => id !== item) as TFieldValues[TName],
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      );
    },
    [fieldName, form]
  );

  const items = (form.watch(fieldName) as string[]) || [];
  const hasError = !!form.formState.errors[fieldName];
  const errorMessage = form.formState.errors[fieldName]?.message as string;

  return {
    addItem,
    removeItem,
    items,
    hasError,
    errorMessage,
  };
};
