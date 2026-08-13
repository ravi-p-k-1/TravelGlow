import { Router } from "express";
import { createSkinAnalysis, getSkinAnalysis, selfieUpload } from "../controllers/skinAnalysisController.js";

export const skinAnalysisRouter = Router({ mergeParams: true });
skinAnalysisRouter.post("/", selfieUpload.single("image"), createSkinAnalysis);
skinAnalysisRouter.get("/", getSkinAnalysis);
