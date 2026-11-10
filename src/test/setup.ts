/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

import { mockHandlers } from "@/app/mock";

// ponytail: Vitest 4+ 的 jsdom 環境把 URL 換成帶 Node createObjectURL 的 compat class；
// jsdom 沒裝 canvas 時 <img> 不觸發 load/error，讀圖片 metadata 會永遠等不到結果。
// 這裡還原 Vitest 3（jsdom 原生 URL）沒有這兩個方法的行為；需要的測試自行 defineProperty mock。
for (const key of ["createObjectURL", "revokeObjectURL"]) {
  Object.defineProperty(URL, key, {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

export const server = setupServer(...mockHandlers);

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
