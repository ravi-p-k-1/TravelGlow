import { Router } from "express";
import { getAnalytics } from "../controllers/analyticsController.js";

export const adminRouter = Router();
adminRouter.get("/analytics", getAnalytics);
