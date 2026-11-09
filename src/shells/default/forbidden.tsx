import { useTranslation } from "react-i18next";

/** R10：內容區 403（填滿 protected layout 的 <Outlet /> 區域，不蓋掉 sidebar；原 components/shared/UnauthorizedPage） */
export const Forbidden = () => {
  const { t } = useTranslation();

  return (
    <div className="flex size-full items-center justify-center">
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
