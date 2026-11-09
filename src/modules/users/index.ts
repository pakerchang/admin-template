import UserFormPage from "@/pages/users/UserForm";
import UserListPage from "@/pages/users/UserList";
import { defineModule } from "@/shared/module";

import { usersRoutes } from "./model/routes";

// 現行 sidebar 沒有 users 項目，不宣告 nav（行為不變）
export default defineModule({
  id: "users",
  kind: "generic",
  routes: (ctx) => usersRoutes(ctx, { list: UserListPage, edit: UserFormPage }),
  permissions: { resources: { users: ["read"] } },
});
