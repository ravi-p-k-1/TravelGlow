import type { Request, Response } from "express";
import { checkDatabaseConnection } from "../config/database.js";

export async function getHealth(_request: Request, response: Response) {
  try {
    await checkDatabaseConnection();

    response.status(200).json({
      status: "ok",
      service: "travelglow-api",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed", error);
    response.status(503).json({
      status: "unavailable",
      service: "travelglow-api",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
}
