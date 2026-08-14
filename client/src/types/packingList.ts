export type PackingCategory = "essential" | "recommended" | "optional";

export interface PackingItem {
  id: string;
  name: string;
  category: PackingCategory;
  reason: string;
  sourceConcernIds: string[];
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
