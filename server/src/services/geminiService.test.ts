import assert from "node:assert/strict";
import test from "node:test";
import type { SkinConcernForecast } from "../domain/skin-engine/types.js";
import { validateGroundedExplanation } from "./geminiService.js";

const concerns: SkinConcernForecast[] = [{
  id: "uv-protection",
  concern: "UV protection",
  level: "high",
  factors: ["Destination UV index is 9"],
  recommendations: ["Use broad-spectrum SPF 50 sunscreen"],
}];

test("accepts explanations grounded in deterministic concern ids and tips", () => {
  const result = validateGroundedExplanation({
    headline: "Prepare for stronger sun",
    summary: "Higher UV may make sun protection more important.",
    concerns: [{ concernId: "uv-protection", explanation: "UV may be more intense than at home." }],
    travelTips: ["Use broad-spectrum SPF 50 sunscreen"],
  }, concerns);
  assert.equal(result.concerns[0]?.concernId, "uv-protection");
});

test("rejects unsupported concerns and invented recommendations", () => {
  assert.throws(() => validateGroundedExplanation({
    headline: "Prepare",
    summary: "Summary",
    concerns: [{ concernId: "hydration", explanation: "Drink water." }],
    travelTips: ["Use prescription treatment"],
  }, concerns));
});
