import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { expect, afterAll, afterEach, beforeAll } from "vitest";

import { mockHandlers } from "@/app/mock";

expect.extend(matchers);

export const server = setupServer(...mockHandlers);

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
