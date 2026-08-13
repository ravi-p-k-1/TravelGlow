import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as environmentService from "../services/environmentService.js";
import { ApiError } from "../utils/apiError.js";

function tripId(request: Request): string {
  const result = z.uuid().safeParse(request.params.id);
  if (!result.success) throw new ApiError(400, "Invalid trip id");
  return result.data;
}

export async function generateEnvironment(request: Request, response: Response, next: NextFunction) {
  try { response.status(200).json({ environment: await environmentService.generateEnvironment(tripId(request)) }); }
  catch (error) { next(error); }
}

export async function getEnvironment(request: Request, response: Response, next: NextFunction) {
  try { response.status(200).json({ environment: await environmentService.getPersistedEnvironment(tripId(request)) }); }
  catch (error) { next(error); }
}
