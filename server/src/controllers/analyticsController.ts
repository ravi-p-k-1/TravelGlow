import type { NextFunction, Request, Response } from "express";
import { analyticsEventInputSchema } from "../domain/analytics/analyticsEventSchema.js";
import * as analyticsService from "../services/analyticsService.js";
import { ApiError } from "../utils/apiError.js";

export async function recordEvent(request: Request, response: Response, next: NextFunction) {
  try {
    const result = analyticsEventInputSchema.safeParse(request.body);
    if (!result.success) throw new ApiError(400, "Invalid analytics event", result.error.flatten());
    response.status(201).json({ event: await analyticsService.recordAnalyticsEvent(result.data) });
  } catch (error) { next(error); }
}

export async function getAnalytics(_request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ analytics: await analyticsService.getAnalyticsSummary() });
  } catch (error) { next(error); }
}
