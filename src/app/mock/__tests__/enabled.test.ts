import { describe, expect, it } from "vitest";

import { isMockEnabled } from "@/app/mock/enabled";

describe("isMockEnabled", () => {
  it.each([
    [undefined, true],
    ["", true],
    ["true", true],
    ["1", true],
    ["false", false],
  ])("VITE_API_MOCK=%s → %s", (flag, expected) => {
    expect(isMockEnabled(flag)).toBe(expected);
  });
});
