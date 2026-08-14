import { skinEngineThresholds as threshold } from "../skin-engine/thresholds.js";
import type { SkinConcernForecast } from "../skin-engine/types.js";
import type { EnvironmentData } from "../../models/environment.js";
import type { PackingItem } from "../../models/packingList.js";
import type { Product, ProductCategory } from "../../models/product.js";
import type { SkinAnalysis } from "../../models/skinAnalysis.js";

export const PRODUCT_RANKER_VERSION = "1.1.0";

export interface RankedProduct {
  product: Product;
  score: number;
  reasons: string[];
}

interface ProductRankingInput {
  products: Product[];
  packingItems: PackingItem[];
  concerns: SkinConcernForecast[];
  destinationEnvironment: EnvironmentData;
  skinAnalysis: SkinAnalysis;
}

const packingCategoryMap: Record<string, ProductCategory> = {
  "broad-spectrum-spf-50": "sunscreen",
  "non-comedogenic-sunscreen": "sunscreen",
  "gentle-cleanser": "cleanser",
  "daily-moisturizer": "moisturizer",
  "lightweight-moisturizer": "moisturizer",
  "barrier-support-moisturizer": "moisturizer",
  "hydrating-serum": "hydrating-serum",
  "lip-spf": "lip-spf",
  "facial-mist": "facial-mist",
  "soothing-after-sun-moisturizer": "after-sun",
};

const categoryLabels: Record<ProductCategory, string> = {
  sunscreen: "sun protection",
  cleanser: "gentle cleanser",
  moisturizer: "moisturizer",
  "hydrating-serum": "hydrating serum",
  "lip-spf": "lip SPF",
  "facial-mist": "optional facial mist",
  "after-sun": "optional after-sun moisturizer",
};

function getClimateTags(destination: EnvironmentData): string[] {
  const tags: string[] = [];
  if ((destination.uvIndex ?? 0) >= 6) tags.push("high-uv");
  if ((destination.humidity ?? 0) >= threshold.highHumidity) tags.push("humid");
  if (destination.humidity !== undefined && destination.humidity <= threshold.lowHumidity) tags.push("dry");
  if ((destination.temperatureF ?? 0) >= 80) tags.push("hot");
  if (destination.temperatureF !== undefined && destination.temperatureF <= 50) tags.push("cold");
  return tags;
}

function getSkinTypes(analysis: SkinAnalysis): string[] {
  const types = ["all"];
  if ((analysis.oiliness ?? 0) >= threshold.moderateOiliness) types.push("oily");
  if ((analysis.acne ?? 0) >= threshold.elevatedAcne) types.push("acne-prone");
  if (analysis.hydration !== undefined && analysis.hydration <= threshold.lowHydration) types.push("dry");
  if ((analysis.redness ?? 0) >= 60) types.push("sensitive");
  return types;
}

function climateReason(tag: string): string {
  const labels: Record<string, string> = {
    "high-uv": "high destination UV",
    humid: "humid destination conditions",
    dry: "dry destination conditions",
    hot: "warm destination conditions",
    cold: "cold destination conditions",
  };
  return `Its profile fits ${labels[tag] ?? "your destination climate"}.`;
}

export function rankProducts({ products, packingItems, concerns, destinationEnvironment, skinAnalysis }: ProductRankingInput): RankedProduct[] {
  const requestedCategories = new Set(
    packingItems.map((item) => packingCategoryMap[item.id]).filter((category): category is ProductCategory => Boolean(category)),
  );
  const concernMap = new Map(concerns.map((concern) => [concern.id, concern]));
  const climateTags = getClimateTags(destinationEnvironment);
  const skinTypes = getSkinTypes(skinAnalysis);

  const scored = products.flatMap((product): RankedProduct[] => {
    if (!requestedCategories.has(product.category)) return [];

    const concernMatches = product.concerns.filter((concern) => concernMap.has(concern as SkinConcernForecast["id"]));
    const climateMatches = product.climateTags.filter((tag) => climateTags.includes(tag));
    const skinMatches = product.skinTypes.filter((type) => skinTypes.includes(type) && type !== "all");
    const relevanceScore = 50 + concernMatches.length * 18 + climateMatches.length * 10
      + skinMatches.length * 6 + (product.skinTypes.includes("all") ? 2 : 0)
      + ((destinationEnvironment.uvIndex ?? 0) >= 6 && (product.spf ?? 0) >= 50 ? 8 : 0);
    const partnerBoost = product.partner ? Math.min(Math.max(product.partnerPriority, 0), 3) : 0;
    const reasons = [`Matches the ${categoryLabels[product.category]} item in your packing plan.`];
    const matchedConcern = concernMatches[0] ? concernMap.get(concernMatches[0] as SkinConcernForecast["id"]) : undefined;
    if (matchedConcern) reasons.push(`Supports your ${matchedConcern.concern.toLowerCase()} forecast priority.`);
    if (climateMatches[0]) reasons.push(climateReason(climateMatches[0]));
    if (skinMatches[0]) reasons.push(`Fits the ${skinMatches[0]}-skin preference indicated by your snapshot.`);
    return [{ product, score: relevanceScore + partnerBoost, reasons: reasons.slice(0, 3) }];
  }).sort((a, b) => b.score - a.score || a.product.brand.localeCompare(b.product.brand) || a.product.name.localeCompare(b.product.name));

  const counts = new Map<ProductCategory, number>();
  return scored.filter(({ product }) => {
    const count = counts.get(product.category) ?? 0;
    if (count >= 2) return false;
    counts.set(product.category, count + 1);
    return true;
  }).slice(0, 12);
}
