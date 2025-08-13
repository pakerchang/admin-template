import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

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
