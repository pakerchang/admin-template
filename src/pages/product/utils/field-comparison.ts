import { path as getPath, join, sort, filter, pipe } from "ramda";

import type { FieldChange } from "../components/ProductEditConfirmDialog";
import type { TProductForm } from "../hooks/use-product";
import type { UseFormReturn, FieldValues } from "react-hook-form";

const getNestedValue = <T>(obj: T, pathStr: string): unknown => {
  const pathArray = pathStr.split(".");
  return getPath(pathArray, obj as Record<string, unknown>);
};

const extractFieldName = (path: string): string => {
  return path;
};

interface ConversionContext {
  suppliers?: Array<{ supplier_id: string; supplier_name: string }>;
  tags?: Array<{ tag_id: string; tag_name: string }>;
}

const formatValue = (
  value: unknown,
  fieldPath?: string,
  context?: ConversionContext
): string => {
  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      typeof value[0] === "object" &&
      value[0] !== null &&
      "file_name" in value[0]
    ) {
      return join(
        ", ",
        sort(
          (a, b) => String(a).localeCompare(String(b)),
          value.map(
            (img: Record<string, unknown>) =>
              (img.file_name as string) ||
              (img.file_url as string) ||
              String(img)
          )
        )
      );
    }

    if (fieldPath === "supplier_id" && context?.suppliers) {
      const supplierNames = value.map((id: unknown) => {
        const supplier = context.suppliers?.find(
          (s) => s.supplier_id === String(id)
        );
        return supplier ? supplier.supplier_name : String(id);
      });
      return join(
        ", ",
        sort((a, b) => String(a).localeCompare(String(b)), supplierNames)
      );
    }

    if (fieldPath === "tag_id" && context?.tags) {
      const tagNames = value.map((id: unknown) => {
        const tag = context.tags?.find((t) => t.tag_id === String(id));
        return tag ? tag.tag_name : String(id);
      });
      return join(
        ", ",
        sort((a, b) => String(a).localeCompare(String(b)), tagNames)
      );
    }

    return join(
      ", ",
      sort((a, b) => String(a).localeCompare(String(b)), value)
    );
  }
  return String(value ?? "");
};

const createFieldChange = (
  path: string,
  currentValue: unknown,
  originalValue: unknown,
  context?: ConversionContext
): FieldChange => ({
  fieldName: extractFieldName(path),
  originalValue: formatValue(originalValue, path, context),
  newValue: formatValue(currentValue, path, context),
});

const extractChangesFromDirtyFields = (
  dirtyFields: FieldValues | undefined,
  currentValues: TProductForm,
  originalValues: TProductForm,
  context?: ConversionContext,
  parentPath = ""
): FieldChange[] => {
  if (!dirtyFields || typeof dirtyFields !== "object") return [];

  const changes: FieldChange[] = [];

  Object.entries(dirtyFields).forEach(([key, dirtyValue]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;

    if (dirtyValue === true) {
      const currentValue = getNestedValue(currentValues, currentPath);
      const originalValue = getNestedValue(originalValues, currentPath);

      changes.push(
        createFieldChange(currentPath, currentValue, originalValue, context)
      );
    } else if (typeof dirtyValue === "object" && dirtyValue !== null) {
      changes.push(
        ...extractChangesFromDirtyFields(
          dirtyValue as FieldValues,
          currentValues,
          originalValues,
          context,
          currentPath
        )
      );
    }
  });

  return changes;
};

const isActualChange = (change: FieldChange): boolean =>
  change.originalValue !== change.newValue;

export const getActualChanges = (
  form: UseFormReturn<TProductForm>,
  originalData: TProductForm,
  context?: ConversionContext
): FieldChange[] => {
  const { dirtyFields } = form.formState;
  const currentValues = form.getValues();

  return pipe(
    (fields: FieldValues | undefined) =>
      extractChangesFromDirtyFields(
        fields,
        currentValues,
        originalData,
        context
      ),
    filter(isActualChange)
  )(dirtyFields);
};
