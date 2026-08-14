import assert from "node:assert/strict";
import test from "node:test";
import { analyticsEventInputSchema } from "./analyticsEventSchema.js";

test("accepts a complete purchase-link event", () => {
  const result = analyticsEventInputSchema.safeParse({
    eventType: "purchase_link_clicked",
    tripId: "a0aa37c8-ed32-4e1c-9afc-5b3c0a52c197",
    productId: "cerave-am-spf50",
    retailer: "CeraVe",
  });
  assert.equal(result.success, true);
});

test("rejects incomplete product analytics and unknown fields", () => {
  assert.equal(analyticsEventInputSchema.safeParse({ eventType: "product_clicked" }).success, false);
  assert.equal(analyticsEventInputSchema.safeParse({ eventType: "product_clicked", tripId: "a0aa37c8-ed32-4e1c-9afc-5b3c0a52c197", productId: "valid", partner: true }).success, false);
});

test("requires a trip and rejects product data on lifecycle events", () => {
  assert.equal(analyticsEventInputSchema.safeParse({ eventType: "trip_created" }).success, false);
  assert.equal(analyticsEventInputSchema.safeParse({ eventType: "trip_created", tripId: "a0aa37c8-ed32-4e1c-9afc-5b3c0a52c197", productId: "not-allowed" }).success, false);
});
