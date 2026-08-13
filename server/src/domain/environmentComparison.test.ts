import assert from "node:assert/strict";
import test from "node:test";
import type { EnvironmentData } from "../models/environment.js";
import { compareEnvironments } from "./environmentComparison.js";

function environment(overrides: Partial<EnvironmentData>): EnvironmentData {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    tripId: "00000000-0000-4000-8000-000000000001",
    snapshotType: "current",
    location: "Test",
    provider: "mock",
    fetchedAt: "2026-08-13T00:00:00.000Z",
    createdAt: "2026-08-13T00:00:00.000Z",
    ...overrides,
  };
}

test("calculates destination minus current environmental differences", () => {
  const result = compareEnvironments(
    environment({ temperatureF: 68, humidity: 55, uvIndex: 5 }),
    environment({
      snapshotType: "destination",
      temperatureF: 89,
      humidity: 82,
      uvIndex: 9,
    }),
  );

  assert.deepEqual(result, {
    temperatureChangeF: 21,
    humidityChange: 27,
    uvChange: 4,
    precipitationChange: undefined,
  });
});

test("preserves missing optional metrics", () => {
  const result = compareEnvironments(
    environment({ humidity: 55 }),
    environment({ snapshotType: "destination", humidity: 48 }),
  );

  assert.equal(result.humidityChange, -7);
  assert.equal(result.temperatureChangeF, undefined);
  assert.equal(result.uvChange, undefined);
});
