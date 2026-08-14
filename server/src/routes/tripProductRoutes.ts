import { Router } from "express";
import { getTripProducts } from "../controllers/productController.js";

export const tripProductRouter = Router({ mergeParams: true });
tripProductRouter.get("/", getTripProducts);
