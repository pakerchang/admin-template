import { Package } from "lucide-react";

import { defineModule } from "@/shared/module";

import { productMockHandlers } from "./mocks/handlers";
import { productRoutes } from "./model/routes";
import ProductCreateFormPage from "./ui/ProductCreateForm";
import ProductDraftFormPage from "./ui/ProductDraftForm";
import ProductEditFormPage from "./ui/ProductEditForm";
import ProductListPage from "./ui/ProductList";

export default defineModule({
  id: "product",
  kind: "domain",
  mockHandlers: productMockHandlers,
  // 表單用 suppliers / tags 的 hooks（spec §5.2）
  requires: ["suppliers", "tags"],
  routes: (ctx) =>
    productRoutes(ctx, {
      list: ProductListPage,
      create: ProductCreateFormPage,
      edit: ProductEditFormPage,
      draft: ProductDraftFormPage,
    }),
  nav: [
    {
      id: "product",
      label: "dashboard.menu.products.title",
      to: "/products",
      icon: Package,
      permission: "product:read",
      order: 50,
    },
  ],
  permissions: {
    resources: { product: ["read", "create", "update", "delete"] },
    mockGrants: { admin: ["product:*"], partner: ["product:*"] },
  },
});
