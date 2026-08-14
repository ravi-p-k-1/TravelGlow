import { Router } from "express";
import { generatePackingList, getPackingList } from "../controllers/packingListController.js";

export const packingListRouter = Router({ mergeParams: true });
packingListRouter.post("/", generatePackingList);
packingListRouter.get("/", getPackingList);
