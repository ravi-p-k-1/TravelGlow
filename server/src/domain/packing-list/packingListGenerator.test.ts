import assert from "node:assert/strict";
import test from "node:test";
import type { EnvironmentData } from "../../models/environment.js";
import type { SkinAnalysis } from "../../models/skinAnalysis.js";
import type { SkinConcernForecast } from "../skin-engine/types.js";
import { generatePackingItems } from "./packingListGenerator.js";

const timestamp = "2026-01-01T00:00:00.000Z";
const destination: EnvironmentData = {
  id: "environment", tripId: "trip", snapshotType: "destination", location: "Miami",
  temperatureF: 88, humidity: 82, uvIndex: 9, provider: "mock",
  fetchedAt: timestamp, createdAt: timestamp,
};
const skinAnalysis: SkinAnalysis = {
  id: "analysis", tripId: "trip", hydration: 45, oiliness: 78,
  provider: "mock", createdAt: timestamp, updatedAt: timestamp,
};
const concern = (id: SkinConcernForecast["id"]): SkinConcernForecast => ({
  id, concern: id, level: "high", factors: [], recommendations: [],
});

test("always includes the four travel essentials with reasons", () => {
  const items = generatePackingItems({ concerns: [concern("uv-protection")], destinationEnvironment: destination, skinAnalysis });
  assert.deepEqual(items.filter((item) => item.category === "essential").map((item) => item.id), [
    "broad-spectrum-spf-50", "gentle-cleanser", "daily-moisturizer", "lip-spf",
  ]);
  assert.ok(items.every((item) => item.reason.length > 0));
});

test("dryness priorities add hydration-focused products", () => {
  const items = generatePackingItems({ concerns: [concern("hydration"), concern("barrier-dryness")], destinationEnvironment: { ...destination, humidity: 28 }, skinAnalysis });
  assert.ok(items.some((item) => item.id === "hydrating-serum"));
  assert.ok(items.some((item) => item.id === "barrier-support-moisturizer"));
});

test("oiliness and heat add lightweight choices without duplicate items", () => {
  const items = generatePackingItems({ concerns: [concern("uv-protection"), concern("oiliness"), concern("heat-congestion")], destinationEnvironment: destination, skinAnalysis });
  assert.ok(items.some((item) => item.id === "lightweight-moisturizer"));
  assert.ok(items.some((item) => item.id === "non-comedogenic-sunscreen"));
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
});
