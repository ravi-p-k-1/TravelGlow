import { Router } from "express";
import { getProduct } from "../controllers/productController.js";

export const productRouter = Router();
productRouter.get("/:id", getProduct);
