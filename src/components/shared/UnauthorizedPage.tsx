import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface IUnauthorizedPageProps {
  titleKey?: string;
  descriptionKey?: string;
  className?: string;
}

export const UnauthorizedPage = ({ className }: IUnauthorizedPageProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn("flex size-full items-center justify-center", className)}
    >
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold text-destructive">
          {t("unauthorized.accessDenied.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("unauthorized.accessDenied.description")}
        </p>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
