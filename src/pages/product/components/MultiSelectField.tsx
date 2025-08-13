import { X } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMultiSelect } from "@/hooks/use-multi-select";

import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  fieldName: TName;
  form: UseFormReturn<TFieldValues>;
  label: string;
  placeholder: string;
  options: SelectOption[];
  isLoading?: boolean;
  className?: string;
}

export const MultiSelectField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  fieldName,
  form,
  label,
  placeholder,
  options,
  isLoading = false,
  className = "",
}: MultiSelectFieldProps<TFieldValues, TName>) => {
  const { addItem, removeItem, items, hasError, errorMessage } = useMultiSelect(
    fieldName,
    form
  );

  return (
    <div className={className}>
      <Label className="text-sm font-medium">{label}</Label>

      <div className="flex flex-wrap items-center gap-3">
        {items.map((value: string) => {
          const option = options.find((opt) => opt.value === value);
          return (
            <div
              key={value}
              className="flex h-10 items-center gap-1 rounded-md border border-gray-300 px-3 text-sm dark:border-gray-600"
            >
              <span>{option?.label || value}</span>
              <button
                type="button"
                onClick={() => removeItem(value)}
                className="ml-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}

        <Select
          value=""
          disabled={isLoading}
          onValueChange={(value: string) => {
            if (value) {
              addItem(value);
            }
          }}
        >
          <SelectTrigger className="flex w-fit items-center justify-center gap-3">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasError && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  );
};
