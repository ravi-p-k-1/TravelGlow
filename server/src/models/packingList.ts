import type { ConcernId } from "../domain/skin-engine/types.js";

export type PackingCategory = "essential" | "recommended" | "optional";

export interface PackingItem {
  id: string;
  name: string;
  category: PackingCategory;
  reason: string;
  sourceConcernIds: ConcernId[];
}

export interface PackingList {
  id: string;
  tripId: string;
  forecastId: string;
  items: PackingItem[];
  generatorVersion: string;
  createdAt: string;
  updatedAt: string;
}
