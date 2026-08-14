import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as productService from "../services/productService.js";
import { ApiError } from "../utils/apiError.js";

function tripId(request: Request): string {
  const result = z.uuid().safeParse(request.params.id);
  if (!result.success) throw new ApiError(400, "Invalid trip id");
  return result.data;
}

function productId(request: Request): string {
  const result = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).safeParse(request.params.id);
  if (!result.success) throw new ApiError(400, "Invalid product id");
  return result.data;
}

export async function getTripProducts(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ recommendations: await productService.getTripProductRecommendations(tripId(request)) });
  } catch (error) { next(error); }
}

export async function getProduct(request: Request, response: Response, next: NextFunction) {
  try {
    response.status(200).json({ product: await productService.getProduct(productId(request)) });
  } catch (error) { next(error); }
}
