import { createRoute, Outlet, redirect } from "@tanstack/react-router";

import { AuthLayout, ProtectedAppLayout } from "@/components/layouts";
import ArticleFormPage from "@/pages/articles/ArticleForm";
import ArticleListPage from "@/pages/articles/ArticleList";
import BannerFormPage from "@/pages/banners/BannerForm";
import BannerListPage from "@/pages/banners/BannerList";
import CustomerListPage from "@/pages/consumers/CustomerList";
import OrderDetailsPage from "@/pages/orders/order-details";
import OrderListPage from "@/pages/orders/OrderList";
import ProductCreateFormPage from "@/pages/product/ProductCreateForm";
import ProductDraftFormPage from "@/pages/product/ProductDraftForm";
import ProductEditFormPage from "@/pages/product/ProductEditForm";
import ProductListPage from "@/pages/product/ProductList";
import SupplierListPage from "@/pages/suppliers/SupplierList";
import TagListPage from "@/pages/tags/TagList";
import TeamMemberListPage from "@/pages/team-members/TeamMemberList";
import UserFormPage from "@/pages/users/UserForm";
import UserListPage from "@/pages/users/UserList";
import { Route as RootRoute } from "@/router/__root";

import type { RouteComponent } from "@tanstack/react-router";

const loginRoute = createRoute({
  path: "/login",
  component: () => <AuthLayout />,
  getParentRoute: () => RootRoute,
});

const usersRoute = createRoute({
  path: "users",
  component: Outlet,
  getParentRoute: () => protectedRoute,
});

const userListRoute = createRoute({
  path: "/",
  component: UserListPage,
  getParentRoute: () => usersRoute,
});

const userManagementRoute = createRoute({
  path: "edit/$id",
  component: UserFormPage,
  getParentRoute: () => usersRoute,
});

const protectedRoute = createRoute({
  path: "/",
  component: ProtectedAppLayout,
  getParentRoute: () => RootRoute,
});

const productsRoute = createRoute({
  path: "products",
  component: Outlet,
  getParentRoute: () => protectedRoute,
});

const productListRoute = createRoute({
  path: "/",
  component: ProductListPage,
  getParentRoute: () => productsRoute,
});

const productCreateRoute = createRoute({
  path: "create",
  component: ProductCreateFormPage,
  getParentRoute: () => productsRoute,
});

const productEditRoute = createRoute({
  path: "edit/$id",
  component: ProductEditFormPage,
  getParentRoute: () => productsRoute,
});

const productDraftRoute = createRoute({
  path: "draft/$id",
  component: ProductDraftFormPage,
  getParentRoute: () => productsRoute,
});

const ordersRoute = createRoute({
  path: "orders",
  component: Outlet,
  loader: ({ location }) => {
    if (location.pathname === "/orders") {
      return redirect({ to: "/orders/order-list" });
    }
  },
  getParentRoute: () => protectedRoute,
});

const orderListRoute = createRoute({
  path: "order-list",
  component: OrderListPage,
  getParentRoute: () => ordersRoute,
});

const orderDetailsRoute = createRoute({
  path: "$id",
  component: OrderDetailsPage,
  getParentRoute: () => ordersRoute,
});

const bannersRoute = createRoute({
  path: "banners",
  component: Outlet,
  getParentRoute: () => protectedRoute,
});

const bannerIndexRoute = createRoute({
  path: "/",
  component: BannerListPage,
  getParentRoute: () => bannersRoute,
});

const bannerCreateRoute = createRoute({
  path: "create",
  component: BannerFormPage,
  getParentRoute: () => bannersRoute,
});

const bannerEditRoute = createRoute({
  path: "edit/$id",
  component: BannerFormPage,
  getParentRoute: () => bannersRoute,
});

const customersRoute = createRoute({
  path: "customers",
  component: CustomerListPage,
  getParentRoute: () => protectedRoute,
});

const teamMembersRoute = createRoute({
  path: "team-members",
  component: TeamMemberListPage,
  getParentRoute: () => protectedRoute,
});

const suppliersRoute = createRoute({
  path: "suppliers",
  component: SupplierListPage,
  getParentRoute: () => protectedRoute,
});

const tagsRoute = createRoute({
  path: "tags",
  component: TagListPage,
  getParentRoute: () => protectedRoute,
});

const articlesRoute = createRoute({
  path: "articles",
  component: Outlet,
  getParentRoute: () => protectedRoute,
});

const articleListRoute = createRoute({
  path: "/",
  component: ArticleListPage,
  getParentRoute: () => articlesRoute,
});

const articleCreateRoute = createRoute({
  path: "create",
  component: ArticleFormPage,
  getParentRoute: () => articlesRoute,
});

const articleEditRoute = createRoute({
  path: "edit/$id",
  component: ArticleFormPage,
  getParentRoute: () => articlesRoute,
});

const routeTree = RootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    usersRoute.addChildren([userListRoute, userManagementRoute]),
    productsRoute.addChildren([
      productListRoute,
      productCreateRoute,
      productEditRoute,
      productDraftRoute,
    ]),
    ordersRoute.addChildren([orderListRoute, orderDetailsRoute]),
    bannersRoute.addChildren([
      bannerIndexRoute,
      bannerCreateRoute,
      bannerEditRoute,
    ]),
    articlesRoute.addChildren([
      articleListRoute,
      articleCreateRoute,
      articleEditRoute,
    ]),
    customersRoute,
    teamMembersRoute,
    suppliersRoute,
    tagsRoute,
  ]),
]);

export { routeTree };
export type { RouteComponent };
