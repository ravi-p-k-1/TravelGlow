import { Router } from "express";
import {
  createTrip,
  getTrip,
  updateTrip,
} from "../controllers/tripController.js";

export const tripRouter = Router();

tripRouter.post("/", createTrip);
tripRouter.get("/:id", getTrip);
tripRouter.patch("/:id", updateTrip);
