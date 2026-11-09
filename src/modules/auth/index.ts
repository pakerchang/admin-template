import LoginPage from "@/components/layouts/LoginPage";
import { defineModule } from "@/shared/module";

import { authMockHandlers } from "./mocks/handlers";
import { authRoutes } from "./model/routes";

export default defineModule({
  id: "auth",
  kind: "generic",
  // login 查 users 的帳號（經其 index.ts）
  requires: ["users"],
  mockHandlers: authMockHandlers,
  publicRoutes: (ctx) => authRoutes(ctx, { login: LoginPage }),
});
