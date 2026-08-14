import { Router } from "express";
import { generateForecast, getForecast } from "../controllers/skinForecastController.js";

export const skinForecastRouter = Router({ mergeParams: true });
skinForecastRouter.post("/", generateForecast);
skinForecastRouter.get("/", getForecast);
