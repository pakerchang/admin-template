import { describe, expectTypeOf, it } from "vitest";

import type { Customer, Order, OrderItem } from "../api/model";
import type {
  customerSchema,
  orderDetailItemSchema,
  transactionHistoryOrderSchema,
} from "../model/schema";
import type { Flat } from "@/test/type-utils";
import type { z } from "zod";

/** T3 AC-1：手寫 schema 與 orval 產物雙向相等 */
describe("consumers schema anchor (T3 AC-1)", () => {
  it("customerSchema ≡ Customer", () => {
    expectTypeOf<z.output<typeof customerSchema>>().toEqualTypeOf<
      Flat<Customer>
    >();
  });
  it("orderDetailItemSchema ≡ OrderItem", () => {
    expectTypeOf<z.output<typeof orderDetailItemSchema>>().toEqualTypeOf<
      Flat<OrderItem>
    >();
  });
  it("transactionHistoryOrderSchema ≡ Order", () => {
    expectTypeOf<
      z.output<typeof transactionHistoryOrderSchema>
    >().toEqualTypeOf<Flat<Order>>();
  });
});
