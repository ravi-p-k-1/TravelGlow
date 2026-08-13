import { app } from "./app.js";
import { database } from "./config/database.js";
import { env } from "./config/env.js";

const server = app.listen(env.port, "0.0.0.0", () => {
  console.log(`TravelGlow API listening on port ${env.port}`);
});

async function shutDown(signal: string) {
  console.log(`${signal} received; shutting down`);

  server.close(async () => {
    await database.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutDown("SIGINT"));
process.on("SIGTERM", () => void shutDown("SIGTERM"));
