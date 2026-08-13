import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import multer from "multer";

export function notFoundHandler(
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  response.status(404).json({
    error: "Not found",
    path: request.path,
  });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      error: error.code === "LIMIT_FILE_SIZE"
        ? "Selfie must be smaller than 10 MB"
        : "The selfie upload could not be processed",
    });
    return;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    response.status(400).json({ error: "Malformed JSON request" });
    return;
  }

  console.error("Unhandled request error", error);
  response.status(500).json({ error: "Internal server error" });
}
