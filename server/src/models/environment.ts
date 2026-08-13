export type EnvironmentSnapshotType = "current" | "destination";

export interface EnvironmentData {
  id: string;
  tripId: string;
  snapshotType: EnvironmentSnapshotType;
  location: string;
  latitude?: number;
  longitude?: number;
  temperatureF?: number;
  humidity?: number;
  uvIndex?: number;
  precipitationChance?: number;
  precipitationMm?: number;
  condition?: string;
  provider: string;
  fetchedAt: string;
  createdAt: string;
}

export type NewEnvironmentData = Omit<
  EnvironmentData,
  "id" | "tripId" | "snapshotType" | "createdAt"
>;

export interface EnvironmentComparison {
  id: string;
  tripId: string;
  temperatureChangeF?: number;
  humidityChange?: number;
  uvChange?: number;
  precipitationChange?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripEnvironment {
  current: EnvironmentData;
  destination: EnvironmentData;
  comparison: EnvironmentComparison;
}
