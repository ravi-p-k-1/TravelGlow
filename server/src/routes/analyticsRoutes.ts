import { Router } from "express";
import { recordEvent } from "../controllers/analyticsController.js";

export const analyticsRouter = Router();
analyticsRouter.post("/events", recordEvent);
