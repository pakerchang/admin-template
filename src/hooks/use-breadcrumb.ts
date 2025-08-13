import { useLocation } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

const useBreadcrumb = (): BreadcrumbItem[] => {
  const location = useLocation();
  const { t } = useTranslation();

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

      let label = segment;

      // 根據路徑段使用對應的翻譯 key
      switch (segment) {
        case "orders":
          label = t("dashboard.menu.orders.title");
          break;
        case "products":
          label = t("dashboard.menu.products.title");
          break;
        case "users":
          label = t("dashboard.menu.users.title");
          break;
        case "banners":
          label = t("dashboard.menu.banners.title");
          break;
        case "articles":
          label = t("dashboard.menu.articles.title");
          break;
        case "create":
          label = t("breadcrumb.create");
          break;
        case "edit":
          label = t("breadcrumb.edit");
          break;
        case "order-list":
          label = t("dashboard.menu.orders.sub.orderList");
          break;
        case "batch-orders":
          label = t("dashboard.menu.orders.sub.batchOrders");
          break;
        default:
          // 如果是 UUID 或 ID 格式，直接顯示 ID
          if (segment.match(/^[a-f0-9-]{8,}$/i) || segment.match(/^\d+$/)) {
            label = segment;
          } else {
            // 保持原始值
            label = segment;
          }
      }

      items.push({
        label,
        path: currentPath,
        isActive,
      });
    });

    return items;
  }, [location.pathname, t]);

  return breadcrumbs;
};

export default useBreadcrumb;
