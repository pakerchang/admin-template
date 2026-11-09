import { toHttpHandlers, toNotFoundHandlers } from "@/app/mock/adapter";
import { apiBaseUrl } from "@/services/api-client";
import { handlers } from "@/services/mock/handlers";

/** browser worker 與 test server 共用的同一組 handler（M3 起改由 registry.mockHandlers 提供） */
export const mockHandlers = [
  ...toHttpHandlers(handlers, { baseUrl: apiBaseUrl }),
  ...toNotFoundHandlers({ baseUrl: apiBaseUrl }),
];
