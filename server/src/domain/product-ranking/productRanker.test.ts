import assert from "node:assert/strict";
import test from "node:test";
import type { PackingItem } from "../../models/packingList.js";
import type { Product } from "../../models/product.js";
import { rankProducts } from "./productRanker.js";

const timestamp = "2026-01-01T00:00:00.000Z";
const baseProduct: Product = {
  id: "base", name: "Base", brand: "Brand", category: "sunscreen",
  concerns: [], skinTypes: [], climateTags: [], partner: false,
  partnerPriority: 0, purchaseLinks: [],
};
const packingItems: PackingItem[] = [{
  id: "broad-spectrum-spf-50", name: "SPF", category: "essential", reason: "UV", sourceConcernIds: ["uv-protection"],
}];
const common = {
  packingItems,
  concerns: [{ id: "uv-protection" as const, concern: "UV protection", level: "high" as const, factors: [], recommendations: [] }],
  destinationEnvironment: { id: "env", tripId: "trip", snapshotType: "destination" as const, location: "Miami", temperatureF: 88, humidity: 82, uvIndex: 9, provider: "mock", fetchedAt: timestamp, createdAt: timestamp },
  skinAnalysis: { id: "skin", tripId: "trip", oiliness: 78, provider: "mock", createdAt: timestamp, updatedAt: timestamp },
};

test("high UV and oily skin rank a matching SPF 50 product first", () => {
  const products: Product[] = [
    { ...baseProduct, id: "generic", name: "Generic SPF", spf: 30 },
    { ...baseProduct, id: "matched", name: "Oil SPF 50", spf: 50, concerns: ["uv-protection", "oiliness"], skinTypes: ["oily"], climateTags: ["high-uv", "hot"] },
  ];
  assert.equal(rankProducts({ ...common, products })[0]?.product.id, "matched");
});

test("partner boost never makes an irrelevant product eligible", () => {
  const products: Product[] = [
    { ...baseProduct, id: "relevant", concerns: ["uv-protection"] },
    { ...baseProduct, id: "partner-cleanser", category: "cleanser", partner: true, partnerPriority: 999 },
  ];
  const ranked = rankProducts({ ...common, products });
  assert.deepEqual(ranked.map((item) => item.product.id), ["relevant"]);
});

test("partner boost stays smaller than a meaningful relevance match", () => {
  const products: Product[] = [
    { ...baseProduct, id: "strong", concerns: ["uv-protection"] },
    { ...baseProduct, id: "partner", partner: true, partnerPriority: 999 },
  ];
  assert.equal(rankProducts({ ...common, products })[0]?.product.id, "strong");
});

test("partner merchandising boost is capped at three points", () => {
  const products: Product[] = [
    { ...baseProduct, id: "standard", name: "Standard" },
    { ...baseProduct, id: "partner", name: "Partner", partner: true, partnerPriority: 999 },
  ];
  const ranked = rankProducts({ ...common, products });
  assert.equal(ranked[0]?.product.id, "partner");
  assert.equal((ranked[0]?.score ?? 0) - (ranked[1]?.score ?? 0), 3);
});
