import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import * as tripService from "../services/tripService.js";
import { ApiError } from "../utils/apiError.js";

const locationSchema = z
  .string()
  .trim()
  .min(2, "Location must contain at least 2 characters")
  .max(200, "Location cannot exceed 200 characters");

const tripFieldsSchema = z.object({
  currentLocation: locationSchema,
  destination: locationSchema,
  departureDate: z.iso.date(),
  returnDate: z.iso.date(),
});

const createTripSchema = tripFieldsSchema.strict();
const updateTripSchema = tripFieldsSchema
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one trip field is required",
  });
const tripIdSchema = z.uuid();

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ApiError(400, "Invalid request", result.error.flatten().fieldErrors);
  }

  return result.data;
}

export async function createTrip(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const input = parseOrThrow(createTripSchema, request.body);
    const trip = await tripService.createTrip(input);
    response.status(201).location(`/api/trips/${trip.id}`).json({ trip });
  } catch (error) {
    next(error);
  }
}

export async function getTrip(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const id = parseOrThrow(tripIdSchema, request.params.id);
    response.status(200).json({ trip: await tripService.getTrip(id) });
  } catch (error) {
    next(error);
  }
}

export async function updateTrip(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const id = parseOrThrow(tripIdSchema, request.params.id);
    const input = parseOrThrow(updateTripSchema, request.body);
    response.status(200).json({ trip: await tripService.updateTrip(id, input) });
  } catch (error) {
    next(error);
  }
}
