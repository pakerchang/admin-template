import { z } from "zod";

import { defineModule } from "@/shared/module";
import { definePermissions } from "@/shared/permission";

import en from "./locales/en.json";
import { usersMockHandlers } from "./mocks/handlers";
import { usersRoutes } from "./model/routes";
import UserFormPage from "./ui/UserForm";
import UserListPage from "./ui/UserList";

// 現行 sidebar 沒有 users 項目，不宣告 nav（行為不變）
const usersPermissions = definePermissions({
  users: z.enum(["read", "update", "update-role"]),
});

declare module "@/shared/permission" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TPermissionRegistry extends Record<
    z.infer<typeof usersPermissions.schema>,
    true
  > {}
}

export default defineModule({
  id: "users",
  kind: "generic",
  mockHandlers: usersMockHandlers,
  routes: (ctx) => usersRoutes(ctx, { list: UserListPage, edit: UserFormPage }),
  // 裸字典（§5.4）；zh 原本就沒有這組 key
  i18n: { en, zh: {} },
  permissions: {
    ...usersPermissions,
    mockGrants: { admin: ["users:read"] },
  },
});

// auth module 的 mock login 查帳號用（auth requires users）
export { findMockUserByEmail } from "./mocks/handlers";
