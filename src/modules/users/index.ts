import UserFormPage from "@/pages/users/UserForm";
import UserListPage from "@/pages/users/UserList";
import { defineModule } from "@/shared/module";

import en from "./locales/en.json";
import { usersRoutes } from "./model/routes";

// 現行 sidebar 沒有 users 項目，不宣告 nav（行為不變）
export default defineModule({
  id: "users",
  kind: "generic",
  routes: (ctx) => usersRoutes(ctx, { list: UserListPage, edit: UserFormPage }),
  // 裸字典（§5.4）；zh 原本就沒有這組 key
  i18n: { en, zh: {} },
  permissions: {
    resources: { users: ["read", "update", "update-role"] },
    mockGrants: { admin: ["users:read"] },
  },
});
