import type { AppModule } from "../../../src/permissions";
import { getListUsersMockHandler } from "./mocks/users.msw";

export { listUsers } from "./api/users";
export const usersModule: AppModule = { id: "users", mockHandlers: [getListUsersMockHandler()], permissions: { listUsers: "users.read" } };
