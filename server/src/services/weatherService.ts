import { env } from "../config/env.js";
import type { NewEnvironmentData } from "../models/environment.js";
import { ApiError } from "../utils/apiError.js";

interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    last_updated_epoch: number;
    temp_f: number;
    humidity: number;
    uv: number;
    precip_mm: number;
    condition: { text: string };
  };
}

interface WeatherApiErrorResponse {
  error?: { message?: string };
}

function displayLocation(location: WeatherApiResponse["location"]): string {
  return [location.name, location.region, location.country]
    .filter(Boolean)
    .join(", ");
}

function getMockEnvironment(
  location: string,
  kind: "current" | "destination",
): NewEnvironmentData {
  const fetchedAt = new Date().toISOString();

  if (kind === "current") {
    return {
      location,
      latitude: 37.7749,
      longitude: -122.4194,
      temperatureF: 68,
      humidity: 55,
      uvIndex: 5,
      precipitationChance: 10,
      precipitationMm: 0,
      condition: "Partly cloudy",
      provider: "mock",
      fetchedAt,
    };
  }

  return {
    location,
    latitude: 25.7617,
    longitude: -80.1918,
    temperatureF: 89,
    humidity: 82,
    uvIndex: 9,
    precipitationChance: 45,
    precipitationMm: 1.2,
    condition: "Sunny intervals",
    provider: "mock",
    fetchedAt,
  };
}

async function fetchLiveEnvironment(location: string): Promise<NewEnvironmentData> {
  if (!env.weatherApiKey) {
    throw new ApiError(
      503,
      "Weather integration is not configured. Enable mock weather or add WEATHER_API_KEY.",
    );
  }

  const url = new URL("https://api.weatherapi.com/v1/current.json");
  url.searchParams.set("key", env.weatherApiKey);
  url.searchParams.set("q", location);
  url.searchParams.set("aqi", "no");

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    console.error("WeatherAPI request failed", error);
    throw new ApiError(502, "Destination conditions could not be retrieved");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as WeatherApiErrorResponse;
    console.error("WeatherAPI returned an error", response.status, body.error?.message);
    throw new ApiError(502, "Destination conditions could not be retrieved");
  }

  const body = (await response.json()) as WeatherApiResponse;
  return {
    location: displayLocation(body.location),
    latitude: body.location.lat,
    longitude: body.location.lon,
    temperatureF: body.current.temp_f,
    humidity: body.current.humidity,
    uvIndex: body.current.uv,
    precipitationMm: body.current.precip_mm,
    condition: body.current.condition.text,
    provider: "weatherapi",
    fetchedAt: new Date(body.current.last_updated_epoch * 1000).toISOString(),
  };
}

export async function getEnvironment(
  location: string,
  kind: "current" | "destination",
): Promise<NewEnvironmentData> {
  return env.useMockWeather
    ? getMockEnvironment(location, kind)
    : fetchLiveEnvironment(location);
}
