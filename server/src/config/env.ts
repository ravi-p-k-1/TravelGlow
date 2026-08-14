import "dotenv/config";

function readPort(value: string | undefined): number {
  const port = Number(value ?? 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be a valid TCP port number");
  }

  return port;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error("Boolean environment variables must be 'true' or 'false'");
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readPort(process.env.PORT),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://travelglow:travelglow_dev@localhost:5432/travelglow",
  weatherApiKey: process.env.WEATHER_API_KEY ?? "",
  useMockWeather: readBoolean(process.env.USE_MOCK_WEATHER, true),
  youcamApiKey: process.env.YOUCAM_API_KEY ?? "",
  useMockYoucam: readBoolean(process.env.USE_MOCK_YOUCAM, true),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
} as const;
