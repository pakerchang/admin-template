import {
  Package,
  UserCog,
  Images,
  Receipt,
  Users,
  FileText,
  Building2,
  Tags,
} from "lucide-react";

import { type TransKey } from "@/constants/locales";

export const sidebarMenu: {
  label: TransKey;
  icon: React.ReactNode;
  path: string;
  sub?: { label: TransKey; path: string }[];
}[] = [
  {
    label: "dashboard.menu.customers.title",
    icon: <Users className="text-white" />,
    path: "customers",
  },
  {
    label: "dashboard.menu.teamMembers.title",
    icon: <UserCog className="text-white" />,
    path: "team-members",
  },
  {
    label: "dashboard.menu.suppliers.title",
    icon: <Building2 className="text-white" />,
    path: "suppliers",
  },
  {
    label: "dashboard.menu.tags.title",
    icon: <Tags className="text-white" />,
    path: "tags",
  },
  {
    label: "dashboard.menu.products.title",
    icon: <Package className="text-white" />,
    path: "products",
  },
  {
    label: "dashboard.menu.orders.title",
    icon: <Receipt className="text-white" />,
    path: "orders",
    sub: [
      {
        label: "dashboard.menu.orders.sub.orderList",
        path: "orders/order-list",
      },
    ],
  },
  {
    label: "dashboard.menu.banners.title",
    icon: <Images className="text-white" />,
    path: "banners",
  },
  {
    label: "dashboard.menu.articles.title",
    icon: <FileText className="text-white" />,
    path: "articles",
  },
];
