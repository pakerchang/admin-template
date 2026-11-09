import LoginPage from "@/components/layouts/LoginPage";
import { defineModule } from "@/shared/module";

import { authRoutes } from "./model/routes";

export default defineModule({
  id: "auth",
  kind: "generic",
  publicRoutes: (ctx) => authRoutes(ctx, { login: LoginPage }),
});
