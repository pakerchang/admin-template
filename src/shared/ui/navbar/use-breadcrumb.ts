import { useLocation } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useRouteTitleResolver } from "@/shared/module";

export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

const useBreadcrumb = (): BreadcrumbItem[] => {
  const location = useLocation();
  const { t } = useTranslation();
  // 頂層呼叫一次（rules-of-hooks）；之後對每個累積路徑呼叫回傳的一般函式
  const title = useRouteTitleResolver();

  const breadcrumbs = useMemo(() => {
    const pathname = location.pathname;
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return [{ label: t("breadcrumb.home"), path: "/", isActive: true }];
    }

    const items: BreadcrumbItem[] = [
      { label: t("breadcrumb.home"), path: "/", isActive: false },
    ];

    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isActive = index === segments.length - 1;

      // nav / routeTitles 的標題由 registry 注入（已翻譯）；create / edit 讀 core 字典；其餘顯示原字串
      const label =
        title(currentPath) ??
        (segment === "create"
          ? t("breadcrumb.create")
          : segment === "edit"
            ? t("breadcrumb.edit")
            : segment);

      items.push({
        label,
        path: currentPath,
        isActive,
      });
    });

    return items;
  }, [location.pathname, t, title]);

  return breadcrumbs;
};

export default useBreadcrumb;
