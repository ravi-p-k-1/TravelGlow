import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import type { SelfieUpload } from "../models/skinAnalysis.js";
import * as skinAnalysisService from "../services/skinAnalysisService.js";
import { ApiError } from "../utils/apiError.js";

const allowedTypes = new Set(["image/jpeg", "image/png"]);
export const selfieUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (allowedTypes.has(file.mimetype)) callback(null, true);
    else callback(new ApiError(400, "Selfie must be a JPEG or PNG image"));
  },
});

function tripId(request: Request): string {
  const result = z.uuid().safeParse(request.params.id);
  if (!result.success) throw new ApiError(400, "Invalid trip id");
  return result.data;
}

export async function createSkinAnalysis(request: Request, response: Response, next: NextFunction) {
  try {
    if (!request.file) throw new ApiError(400, "A selfie image is required");
    const image: SelfieUpload = { buffer: request.file.buffer,
      contentType: request.file.mimetype as SelfieUpload["contentType"],
      fileName: request.file.originalname, size: request.file.size };
    response.status(201).json({ analysis: await skinAnalysisService.createSkinAnalysis(tripId(request), image) });
  } catch (error) { next(error); }
}

export async function getSkinAnalysis(request: Request, response: Response, next: NextFunction) {
  try { response.status(200).json({ analysis: await skinAnalysisService.getPersistedSkinAnalysis(tripId(request)) }); }
  catch (error) { next(error); }
}
