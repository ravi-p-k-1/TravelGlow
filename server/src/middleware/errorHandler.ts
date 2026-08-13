import type { NextFunction, Request, Response } from "express";

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
  console.error("Unhandled request error", error);
  response.status(500).json({ error: "Internal server error" });
}
