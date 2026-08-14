import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as forecastService from "../services/skinForecastService.js";
import { ApiError } from "../utils/apiError.js";

function tripId(request: Request): string {
  const result = z.uuid().safeParse(request.params.id);
  if (!result.success) throw new ApiError(400, "Invalid trip id");
  return result.data;
}

export async function generateForecast(request: Request, response: Response, next: NextFunction) {
  try { response.status(200).json({ forecast: await forecastService.generateForecast(tripId(request)) }); }
  catch (error) { next(error); }
}

export async function getForecast(request: Request, response: Response, next: NextFunction) {
  try { response.status(200).json({ forecast: await forecastService.getPersistedForecast(tripId(request)) }); }
  catch (error) { next(error); }
}
