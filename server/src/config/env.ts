import "dotenv/config";

function readPort(value: string | undefined): number {
  const port = Number(value ?? 5000);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be a valid TCP port number");
  }

  return port;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readPort(process.env.PORT),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://travelglow:travelglow_dev@localhost:5432/travelglow",
} as const;
