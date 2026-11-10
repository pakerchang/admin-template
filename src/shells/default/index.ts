import { AuthLayout } from "@/shells/default/auth-layout";
import { Forbidden } from "@/shells/default/forbidden";
import { ProtectedAppLayout } from "@/shells/default/protected-layout";

import type { TShell } from "@/shared/module";

// default shell 屬 core：不得在 pages 覆寫 domain 頁（§4.4）
export const defaultShell: TShell = {
  id: "default",
  ProtectedLayout: ProtectedAppLayout,
  AuthLayout,
  Forbidden,
};
