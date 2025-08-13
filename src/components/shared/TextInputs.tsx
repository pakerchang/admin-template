import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { FieldError } from "react-hook-form";

export interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  error?: FieldError;
}

export const TextInput = ({
  label,
  className,
  error,
  ...props
}: TextInputProps) => {
  return (
    <div className={cn("flex grow flex-col gap-2", className)}>
      <div className="relative flex">
        <Input
          {...props}
          id={label}
          className={cn("peer h-14 pt-4", error && "border-destructive")}
          placeholder=" "
        />
        {label && (
          <Label
            className={cn(
              "absolute left-3 top-4 text-muted-foreground transition-all",
              "peer-placeholder-shown:top-4 peer-placeholder-shown:text-base",
              "peer-focus:top-2 peer-focus:text-xs",
              "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs"
            )}
            htmlFor={label}
          >
            {label}
          </Label>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
};

type LangTextInput = Omit<TextInputProps, "label">;
export interface LangTextInputProps {
  className?: string;
  zh: LangTextInput;
  en: LangTextInput;
  th: LangTextInput;
  error?: FieldError;
}

export const LangTextInput = ({
  className,
  zh,
  en,
  th,
  error,
}: LangTextInputProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn("flex grow flex-col gap-2", className)}>
      <div className="flex gap-2">
        <TextInput
          {...zh}
          className="w-full"
          label={t("lng.zh")}
          placeholder={t("lng.zh")}
          error={error}
        />
        <TextInput
          {...en}
          className="w-full"
          label={t("lng.en")}
          placeholder={t("lng.en")}
          error={error}
        />
        <TextInput
          {...th}
          className="w-full"
          label={t("lng.th")}
          placeholder={t("lng.th")}
          error={error}
        />
      </div>
    </div>
  );
};

export interface LangFormInputProps extends LangTextInputProps {
  label: string;
}
export const LangFormInput = ({
  className,
  label,
  error,
  ...props
}: LangFormInputProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label className="text-lg font-medium">{label}</Label>
      <LangTextInput {...props} error={error} />
    </div>
  );
};
