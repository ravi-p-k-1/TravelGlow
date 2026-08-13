import { Router } from "express";
import { generateEnvironment, getEnvironment } from "../controllers/environmentController.js";

export const environmentRouter = Router({ mergeParams: true });
environmentRouter.post("/", generateEnvironment);
environmentRouter.get("/", getEnvironment);
