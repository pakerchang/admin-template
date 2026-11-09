import { PUBLIC, type AppModule } from "../../../src/permissions";
import { getLoginMockHandler } from "./mocks/auth.msw";

export { login } from "./api/auth";
export const authModule: AppModule = {
  id: "auth",
  permissions: { login: PUBLIC },
  mockHandlers: [getLoginMockHandler(async ({ request }) => ({ token: (await request.json()).username }))], // ponytail: token = 角色名，對應測試的 Bearer <role>
};
