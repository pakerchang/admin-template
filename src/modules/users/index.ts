import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { usersMockHandlers } from "./mocks/handlers";
import { usersRoutes } from "./model/routes";
import UserFormPage from "./ui/UserForm";
import UserListPage from "./ui/UserList";

const usersPermissions = definePermissions({
  users: z.enum(["read", "create", "update", "update-role"]),
});

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof usersPermissions.schema>,
    true
  > {}
}

declare module "@/shared/i18n/types" {
  interface TranslationResources {
    users: typeof zh;
  }
}

declare module "@/shared/module" {
  interface TModuleIdRegistry {
    users: true;
  }
}

export default defineModule({
  id: "users",
  kind: "generic",
  mockHandlers: usersMockHandlers,
  routes: (ctx) =>
    usersRoutes(ctx, {
      list: UserListPage,
      create: UserFormPage,
      edit: UserFormPage,
    }),
  i18n: { en, zh },
  // sidebar 沒有 users 項目（不宣告 nav）；breadcrumb 標題經 routeTitles（i18n-scope-migration 補裁 4）
  routeTitles: [{ to: "/users", label: "title" }],
  permissions: {
    ...usersPermissions,
    mockGrants: { admin: ["users:read"] },
  },
});

// auth module 的 mock login 查帳號用（auth requires users）
export { findMockUserByEmail } from "./mocks/handlers";
