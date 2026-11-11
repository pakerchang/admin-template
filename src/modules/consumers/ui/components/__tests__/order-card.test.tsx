import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createTestI18n } from "@/test/i18n";

import OrderCard from "../OrderCard";

import type { Order } from "../../../api/model";

/** T3 AC-3 (G1)：`created_at` 依 YAML 為選填，缺值顯示 `—`，不得出現 Invalid Date */
const base: Order = {
  order_id: "order-1",
  vendor_id: "",
  user_id: "user-1",
  order_status: "pending",
  order_detail: [],
  contact_info: { address: "a", phone: "p", email: "e@example.com" },
  remark: "",
  delivery_fee: "0",
  delivery_note: "",
  delivery_time: "",
  total_order_fee: "100",
};

const renderCard = (order: Order) => {
  const { I18nWrapper } = createTestI18n({ zh: {}, en: {} }, "zh");
  return render(
    <I18nWrapper>
      <OrderCard order={order} />
    </I18nWrapper>
  );
};

describe("OrderCard created_at（T3 AC-3）", () => {
  it("created_at 省略 → 顯示 —，不含 Invalid Date", () => {
    const { container } = renderCard(base);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(container.textContent).not.toContain("Invalid Date");
  });

  it("created_at 有值 → 顯示格式化日期", () => {
    const { container } = renderCard({
      ...base,
      created_at: "2025-06-30T08:05:00",
    });
    expect(container.textContent).toContain("2025-06-30 08:05");
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });
});
