import { beforeEach, describe, expect, it } from "vitest";

import { mountAsSuperadmin } from "@/test/sign-in";

import { listOrders, updateOrder } from "../../api/orders";

describe("orders mock handlers (M7 AC-6)", () => {
  beforeEach(mountAsSuperadmin);

  it("update then list reads the new status (orval override over seed memory)", async () => {
    await updateOrder({ order_id: "order-1001", order_status: "completed" });
    const { data } = await listOrders({ order_id: "order-1001" });
    expect(data?.[0].order_status).toBe("completed");
  });

  it("update an unknown order → 404 before the orval handler", async () => {
    await expect(
      updateOrder({ order_id: "order-nope", order_status: "completed" })
    ).rejects.toMatchObject({ status: 404 });
  });
});
