import type { EnvironmentData } from "../models/environment.js";

export interface EnvironmentDifferences {
  temperatureChangeF?: number;
  humidityChange?: number;
  uvChange?: number;
  precipitationChange?: number;
}

function difference(
  current: number | undefined,
  destination: number | undefined,
): number | undefined {
  if (current === undefined || destination === undefined) return undefined;
  return Math.round((destination - current) * 10) / 10;
}

export function compareEnvironments(
  current: EnvironmentData,
  destination: EnvironmentData,
): EnvironmentDifferences {
  return {
    temperatureChangeF: difference(
      current.temperatureF,
      destination.temperatureF,
    ),
    humidityChange: difference(current.humidity, destination.humidity),
    uvChange: difference(current.uvIndex, destination.uvIndex),
    precipitationChange: difference(
      current.precipitationChance,
      destination.precipitationChance,
    ),
  };
}
