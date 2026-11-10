import { describe, expect, it, vi } from "vitest";

import { mockHandlers } from "@/app/mock";
import { startMockWorker } from "@/app/mock/start-worker";

const APP = "http://localhost:5173";

describe("startMockWorker apiBaseUrl check (AC-7, R24)", () => {
  it.each([
    ["unset", undefined, /requires VITE_API_BASE_URL/],
    ["empty", "", /requires VITE_API_BASE_URL/],
    ["relative", "/api", /is not an absolute URL/],
    ["same-origin root", `${APP}/`, /must not share the app origin/],
    ["same-origin sub-path", `${APP}/api`, /must not share the app origin/],
    // C1：非純 origin 會讓 client 的絕對路徑（/nope）落出 guard 範圍
    [
      "cross-origin sub-path",
      "http://mock-api.test/api",
      /must be a bare origin/,
    ],
    [
      "cross-origin with query",
      "http://mock-api.test/?x=1",
      /must be a bare origin/,
    ],
    // 這些 scheme 的 href 也是 origin + "/"，bare-origin 檢查擋不住
    ["ftp scheme", "ftp://mock-api.test", /must use http or https/],
    ["ws scheme", "ws://mock-api.test", /must use http or https/],
    ["wss scheme", "wss://mock-api.test", /must use http or https/],
  ])("throws when apiBaseUrl is %s", async (_, apiBaseUrl, message) => {
    const start = vi.fn();
    await expect(
      startMockWorker(mockHandlers, { apiBaseUrl, appOrigin: APP, start })
    ).rejects.toThrow(message);
    expect(start).not.toHaveBeenCalled();
  });

  it("starts the worker with the registry handlers on a dedicated origin", async () => {
    const start = vi.fn().mockResolvedValue(undefined);
    await startMockWorker(mockHandlers, {
      apiBaseUrl: "http://mock-api.local",
      appOrigin: APP,
      start,
    });
    expect(start).toHaveBeenCalledWith(mockHandlers);
  });

  it.each(["http://MOCK-API.test:80", "http://mock-api.test/"])(
    "accepts %s (normalizes to a bare origin)",
    async (apiBaseUrl) => {
      const start = vi.fn().mockResolvedValue(undefined);
      await startMockWorker(mockHandlers, {
        apiBaseUrl,
        appOrigin: APP,
        start,
      });
      expect(start).toHaveBeenCalledOnce();
    }
  );
});
