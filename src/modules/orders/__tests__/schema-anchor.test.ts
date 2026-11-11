import { describe, expectTypeOf, it } from "vitest";

import type { ContactInfo, Order, OrderItem, OrderStatus } from "../api/model";
import type {
  EOrderStatus,
  baseOrderSchema,
  contactInfoSchema,
  orderItemSchema,
  orderStatusSchema,
} from "../model/schema";
import type { Flat } from "@/test/type-utils";
import type { z } from "zod";

/** T3 AC-1 / AC-3 (G3)：手寫 schema 與 orval 產物雙向相等；TS enum 值域與 YAML 一致 */
describe("orders schema anchor (T3 AC-1 / AC-3)", () => {
  it("orderItemSchema ≡ OrderItem", () => {
    expectTypeOf<z.output<typeof orderItemSchema>>().toEqualTypeOf<
      Flat<OrderItem>
    >();
  });
  it("contactInfoSchema ≡ ContactInfo", () => {
    expectTypeOf<z.output<typeof contactInfoSchema>>().toEqualTypeOf<
      Flat<ContactInfo>
    >();
  });
  it("baseOrderSchema ≡ Order", () => {
    expectTypeOf<z.output<typeof baseOrderSchema>>().toEqualTypeOf<
      Flat<Order>
    >();
  });
  it("orderStatusSchema ≡ OrderStatus", () => {
    expectTypeOf<
      z.output<typeof orderStatusSchema>
    >().toEqualTypeOf<OrderStatus>();
  });
  it("`${EOrderStatus}` ≡ OrderStatus", () => {
    expectTypeOf<`${EOrderStatus}`>().toEqualTypeOf<OrderStatus>();
  });
});
