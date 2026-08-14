import assert from "node:assert/strict";
import test from "node:test";
import type { TravelSkinInput } from "./types.js";
import { runTravelSkinEngine } from "./travelSkinEngine.js";

function input(overrides: {
  skin?: Record<string, number>;
  destination?: Record<string, number>;
  comparison?: Record<string, number>;
} = {}): TravelSkinInput {
  const common = { id: "id", tripId: "trip", createdAt: "2026-01-01T00:00:00Z" };
  return {
    skinAnalysis: { ...common, updatedAt: common.createdAt, provider: "mock", ...overrides.skin },
    currentEnvironment: { ...common, snapshotType: "current", location: "Home", provider: "mock", fetchedAt: common.createdAt, temperatureF: 68, humidity: 55, uvIndex: 5 },
    destinationEnvironment: { ...common, snapshotType: "destination", location: "Away", provider: "mock", fetchedAt: common.createdAt, temperatureF: 89, humidity: 82, uvIndex: 9, ...overrides.destination },
    comparison: { ...common, updatedAt: common.createdAt, temperatureChangeF: 21, humidityChange: 27, uvChange: 4, ...overrides.comparison },
  };
}

test("high UV creates a high sunscreen priority", () => {
  const concern = runTravelSkinEngine(input()).find((item) => item.id === "uv-protection");
  assert.equal(concern?.level, "high");
  assert.ok(concern?.recommendations.some((item) => item.includes("SPF 50")));
});

test("low humidity and low hydration create a high hydration concern", () => {
  const concern = runTravelSkinEngine(input({ skin: { hydration: 45 }, destination: { humidity: 30 }, comparison: { humidityChange: -25 } })).find((item) => item.id === "hydration");
  assert.equal(concern?.level, "high");
  assert.ok(concern?.recommendations.some((item) => item.includes("hydrating serum")));
});

test("high humidity and elevated oiliness recommend lightweight skincare", () => {
  const concern = runTravelSkinEngine(input({ skin: { oiliness: 78 } })).find((item) => item.id === "oiliness");
  assert.equal(concern?.level, "high");
  assert.ok(concern?.recommendations.some((item) => item.includes("lightweight moisturizer")));
});

test("a substantially colder dry destination increases barrier concern", () => {
  const concern = runTravelSkinEngine(input({ skin: { hydration: 47 }, destination: { humidity: 30 }, comparison: { temperatureChangeF: -20, humidityChange: -25 } })).find((item) => item.id === "barrier-dryness");
  assert.equal(concern?.level, "high");
  assert.ok(concern?.recommendations.some((item) => item.includes("barrier-support")));
});

test("missing skin metrics are handled without inventing concerns", () => {
  const concerns = runTravelSkinEngine(input());
  assert.equal(concerns.some((item) => item.id === "oiliness"), false);
  assert.equal(concerns.some((item) => item.id === "heat-congestion"), false);
});
