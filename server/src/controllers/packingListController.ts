import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as packingListService from "../services/packingListService.js";
import { ApiError } from "../utils/apiError.js";

function tripId(request: Request): string {
  const result = z.uuid().safeParse(request.params.id);
  if (!result.success) throw new ApiError(400, "Invalid trip id");
  return result.data;
}

export async function generatePackingList(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ packingList: await packingListService.generatePackingList(tripId(request)) });
  } catch (error) { next(error); }
}

export async function getPackingList(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ packingList: await packingListService.getPersistedPackingList(tripId(request)) });
  } catch (error) { next(error); }
}
