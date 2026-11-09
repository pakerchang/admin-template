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
});
