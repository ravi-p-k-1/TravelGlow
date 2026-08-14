import type { EnvironmentData } from "../../models/environment.js";
import type { PackingItem } from "../../models/packingList.js";
import type { SkinAnalysis } from "../../models/skinAnalysis.js";
import type { ConcernId, SkinConcernForecast } from "../skin-engine/types.js";

export const PACKING_LIST_GENERATOR_VERSION = "1.0.0";

interface PackingListInput {
  concerns: SkinConcernForecast[];
  destinationEnvironment: EnvironmentData;
  skinAnalysis: SkinAnalysis;
}

function concernIds(concerns: SkinConcernForecast[], ids: ConcernId[]): ConcernId[] {
  const present = new Set(concerns.map((concern) => concern.id));
  return ids.filter((id) => present.has(id));
}

export function generatePackingItems({
  concerns,
  destinationEnvironment,
  skinAnalysis,
}: PackingListInput): PackingItem[] {
  const uv = destinationEnvironment.uvIndex;
  const humidity = destinationEnvironment.humidity;
  const has = (id: ConcernId) => concerns.some((concern) => concern.id === id);
  const items: PackingItem[] = [
    {
      id: "broad-spectrum-spf-50",
      name: "Broad-spectrum SPF 50 sunscreen",
      category: "essential",
      reason: uv === undefined
        ? "Daily sun protection remains a travel essential even when UV data is unavailable."
        : `Your destination UV index is ${uv}, so dependable daily sun protection belongs in your core kit.`,
      sourceConcernIds: concernIds(concerns, ["uv-protection"]),
    },
    {
      id: "gentle-cleanser",
      name: "Gentle cleanser",
      category: "essential",
      reason: has("heat-congestion") || has("oiliness")
        ? "A gentle cleanse can remove sunscreen and perspiration without adding an unnecessarily harsh step."
        : "A familiar gentle cleanser helps keep your routine consistent while the climate changes.",
      sourceConcernIds: concernIds(concerns, ["oiliness", "heat-congestion", "hydration", "barrier-dryness"]),
    },
    {
      id: "daily-moisturizer",
      name: "Daily moisturizer",
      category: "essential",
      reason: humidity === undefined
        ? "A familiar moisturizer helps support everyday comfort while traveling."
        : `Destination humidity is ${humidity}%, making a familiar moisturizer a useful baseline for your routine.`,
      sourceConcernIds: concernIds(concerns, ["hydration", "barrier-dryness", "oiliness"]),
    },
    {
      id: "lip-spf",
      name: "Lip SPF",
      category: "essential",
      reason: "Lips are exposed during outdoor travel too, so a portable SPF makes reapplication easier.",
      sourceConcernIds: concernIds(concerns, ["uv-protection"]),
    },
  ];

  if (has("hydration") || has("barrier-dryness")) {
    items.push({
      id: "hydrating-serum",
      name: "Hydrating serum",
      category: "recommended",
      reason: skinAnalysis.hydration === undefined
        ? "The destination's dry conditions raised a hydration priority in your forecast."
        : `Your hydration score is ${skinAnalysis.hydration}, and the destination's dry conditions raised a hydration priority.`,
      sourceConcernIds: concernIds(concerns, ["hydration", "barrier-dryness"]),
    });
  }

  if (has("barrier-dryness")) {
    items.push({
      id: "barrier-support-moisturizer",
      name: "Barrier-support moisturizer",
      category: "recommended",
      reason: "The colder, drier destination pattern may make a richer moisturizer more comfortable than your usual option.",
      sourceConcernIds: ["barrier-dryness"],
    });
  }

  if (has("oiliness") || has("heat-congestion")) {
    items.push(
      {
        id: "lightweight-moisturizer",
        name: "Lightweight moisturizer",
        category: "recommended",
        reason: `Your forecast pairs ${has("oiliness") ? "oiliness" : "heat"} with warmer or more humid travel conditions, so lighter layers may feel more comfortable.`,
        sourceConcernIds: concernIds(concerns, ["oiliness", "heat-congestion"]),
      },
      {
        id: "non-comedogenic-sunscreen",
        name: "Non-comedogenic sunscreen",
        category: "recommended",
        reason: "This keeps sun protection central while matching the oiliness or congestion priority identified by the engine.",
        sourceConcernIds: concernIds(concerns, ["uv-protection", "oiliness", "heat-congestion"]),
      },
    );
  }

  if (has("heat-congestion") || (destinationEnvironment.temperatureF ?? 0) >= 80) {
    items.push({
      id: "facial-mist",
      name: "Facial mist",
      category: "optional",
      reason: "A simple mist can be a refreshing comfort step in warm conditions, but it is not required for your routine.",
      sourceConcernIds: concernIds(concerns, ["heat-congestion"]),
    });
  }

  if ((uv ?? 0) >= 6) {
    items.push({
      id: "soothing-after-sun-moisturizer",
      name: "Soothing after-sun moisturizer",
      category: "optional",
      reason: `With a destination UV index of ${uv}, a familiar soothing moisturizer can be useful after extended outdoor time.`,
      sourceConcernIds: concernIds(concerns, ["uv-protection"]),
    });
  }

  return items;
}
