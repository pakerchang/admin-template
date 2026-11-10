import { useTranslation } from "react-i18next";

import { cn } from "@/shared/lib/utils";
import { Spinner } from "@/shared/ui/spinner";

interface ILoadingPageProps {
  className?: string;
}

export const LoadingPage = ({ className }: ILoadingPageProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn(className, "flex h-screen items-center justify-center")}>
      <div className="flex flex-col items-center gap-2 text-lg">
        <Spinner />
        <span>{t("unauthorized.loading")}</span>
      </div>
    </div>
  );
};

export default LoadingPage;
